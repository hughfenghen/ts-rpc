#!/usr/bin/env node

import { Command } from 'commander'
import path from 'path'

import fs from 'fs'
import got from 'got'
import { scan } from './rpc-definition-scan'
import { TRPCMetaData, TRPCMetaFile } from '../common'
import { InterfaceDeclaration, MethodSignature, Project, SyntaxKind } from 'ts-morph'
import { addNode, collectTypeDeps, isStandardType, ITCDeclaration } from './utils'

const program = new Command()

if (process.env.NODE_ENV !== 'test') {
  init()
}

const fsP = fs.promises

function init (): void {
  program.command('client')
    .description('客户端同步声明文件')
    .requiredOption('-c, --config <path>', '指定远端服务配置，用于获取RPC服务声明文件')
    .option('--outMeta', '是否向输出文件中添加 Meta 信息')
    .action(async ({ config, outMeta }) => {
      try {
        const cfgPath = path.resolve(process.cwd(), config)
        const { client: { apps, genRPCDefintionTarget } } = await import(cfgPath)

        const outPath = path.resolve(
          path.dirname(cfgPath),
          genRPCDefintionTarget,
          'rpc-definition.ts'
        )
        let localDefStr = ''
        if (fs.existsSync(outPath)) {
          localDefStr = await fsP.readFile(outPath, { encoding: 'utf-8' })
        }

        const dts = await handleClientCmd(apps, localDefStr, { outMeta })
        if (!fs.existsSync(path.dirname(outPath))) {
          fs.mkdirSync(path.dirname(outPath))
        }

        fs.writeFile(outPath, `${dts}`, { flag: 'w' }, (err) => {
          if (err != null) throw err
          console.log('ts-brpc > 声明文件同步成功：', outPath)
        })
      } catch (err) {
        console.error((err as Error).message)
      }
    })

  program.command('server')
    .description('服务端生成声明文件')
    .requiredOption('-c, --config <path>', '指定远端服务配置，用于获取RPC服务声明文件')
    .option('--metaOutDir <path>', 'Meta 文件输出位置')
    .action(async ({ config, metaOutDir: cliMetaDir }) => {
      try {
        console.log('ts-brpc > 开始扫描 RPCService')
        const cfgPath = path.resolve(process.cwd(), config)
        const { metaOutDir: cfgMetaDir, metaFile } = await handleServerCmd(cfgPath)

        const metaOutDir = cliMetaDir == null
          ? path.resolve(path.dirname(cfgPath), cfgMetaDir)
          : path.resolve(process.cwd(), cliMetaDir)

        fs.writeFile(
          path.resolve(metaOutDir, '_rpc_gen_meta_.json'),
          JSON.stringify(metaFile, null, 2),
          (err) => {
            if (err != null) throw err
            console.log('ts-brpc > 扫描完成，已创建 RPC meta 文件')
          }
        )
      } catch (err) {
        console.error(err)
      }
    })

  program.parse(process.argv)
}

/**
 * 扫描指定目录中的 ts 文件，_rpc_gen_meta_.json 文件内容
 */
export async function handleServerCmd (cfgPath: string): Promise<{ metaOutDir: string, metaFile: TRPCMetaFile }> {
  const { appId, server } = await import(cfgPath)
  const tsCfgPath = findTSCfgPath(path.dirname(cfgPath))
  const scanData = scan(
    server.scanDir
      .map((p: string) => path.resolve(path.dirname(cfgPath), p)),
    appId,
    {
      tsConfigFilePath: tsCfgPath ?? undefined
    }
  )
  scanData.meta = scanData.meta.map(m => ({
    ...m,
    path: path.relative(path.dirname(cfgPath), m.path)
  }))

  return {
    metaOutDir: server.metaOutDir,
    metaFile: {
      appId,
      ...scanData
    }
  }
}

/**
 * 从多个远程获取声明文件，然后与本地声明文件合并（覆盖）
 */
export async function handleClientCmd (
  apps: {[key: string]: string},
  localDefStr: string,
  { outMeta }: { outMeta?: boolean }
): Promise<string> {
  const serverDts = (await Promise.all(
    Object.entries(apps)
      .map(async ([k, v]) => {
        const url = `http://${v}/_rpc_definition_`
        return await got.get(url)
          .then(({ body }) => {
            const data = JSON.parse(body)
            console.log('√ ', k, ': ', url, '; 同步成功。')
            return data
          })
          .catch((err) => {
            console.warn('x ', k, ': ', url, '; 同步失败：', err.message)
            return null
          })
      })
  )).filter(Boolean)
    .reduce((sum, acc) => ({
      ...sum,
      [acc.appId]: { dts: acc.dts, meta: acc.meta }
    }), {}) as { [appId: string]: { dts: string, meta: TRPCMetaData }}

  if (Object.keys(serverDts).length === 0) return ''

  const prj = new Project({
    compilerOptions: {
      declaration: false,
      sourceMap: false,
      isolatedModules: true
    }
  })

  const startComment = localDefStr.includes('/* eslint-disable */')
    ? ''
    : '/* eslint-disable */'

  const sf = prj.createSourceFile('localDefstr', localDefStr.trim())
  // 将本地文件内容 替换为 远端获取的内容（根据 appId 替换）
  Object.keys(serverDts).forEach((appId) => {
    sf.getTypeAlias(appId)?.remove()
    sf.getModule(`${appId}NS`)?.remove()
    sf.getVariableDeclaration(`${appId}Meta`)?.remove()
  })

  const codeStr = Object.entries(serverDts)
    .map(([appId, { dts, meta }]) => [
      dts,
      outMeta === true
        ? `export const ${appId}Meta = ${JSON.stringify(meta, null, 2)};`
        : ''
    ].join('\n'))
    .join('\n')

  // 合并 (注释 + 本地代码 + 同步的新代码)
  return `${startComment}\n${sf.getFullText().trim()}\n${codeStr}`
}

export function filterService (
  code: string,
  appMeta: Record<string, TRPCMetaData>,
  includeServices: string[]
): { code: string, meta: Record<string, TRPCMetaData> } {
  const prj = new Project()
  const inSf = prj.createSourceFile('input.ts', code)
  const outSf = prj.createSourceFile('output.ts', '')
  inSf.getModules()
    .map((m) => [
      m.getName(),
      // App中存在 service 名字，说明该命名空间包含需要保留的 service
      m.getInterface('App')
        ?.getProperties()
        .filter(p => includeServices.includes(p.getName()))
        .map(p => m.getInterface(p.getName()))
    ])
    // 排除没有 serverice 的 namespace
    .filter(([nsName, services]) => services != null && services.length > 0)
    // 收集 serverice 依赖 [ns, service, serviceDeps]
    .map(([nsName, services]) => [
      nsName,
      services,
      (services as InterfaceDeclaration[]).map(
        s => s.getMethods()
          .map(m => [...m.getParameters(), m.getReturnTypeNodeOrThrow()])
          .flat()
          .map(n => collectTypeDeps(n, prj))
          .flat()
          // TODO: 去重
          .filter(n => !isStandardType(n))
      ).flat()
    ])
    .forEach(([nsName, services, deps]) => {
      // 将保留的 [ns, service, serviceDeps]写入 output，生成代码
      const ns = outSf.addModule({ name: nsName as string })
      const app = ns.addInterface({ name: 'App' })
      ns.setIsExported(true)
      app.setIsExported(true)
      ; (services as InterfaceDeclaration[])
        .forEach(s => {
          app.addProperty({ name: s.getName(), type: s.getName() })
          ns.addInterface(s.getStructure())
        })
      ;(deps as ITCDeclaration[]).forEach((dep: ITCDeclaration) => {
        addNode(ns, dep)?.setIsExported(true)
      })
    })

  return {
    code: outSf.getFullText(),
    meta: Object.fromEntries(
      Object.entries(appMeta)
        .map(([appId, meta]) => [
          appId,
          meta.filter(({ name }) => includeServices.includes(name))
        ])
        .filter(([appId, meta]) => meta.length > 0)
    )
  }
}

/**
 * 递归向上查找 tsconfig.json 的位置
 */
export function findTSCfgPath (p: string): string | null {
  if (p === '/' || !fs.existsSync(p)) return null

  const tsCfgPath = path.resolve(p, 'tsconfig.json')
  if (fs.existsSync(tsCfgPath)) return tsCfgPath

  const pkgPath = path.resolve(p, 'package.json')
  if (fs.existsSync(pkgPath)) return null

  return findTSCfgPath(path.resolve(p, '..'))
}
