#!/usr/bin/env node

import { Command } from 'commander'
import path from 'path'

import fs from 'fs'
import got from 'got'
import { scan } from './rpc-definition-scan'
import { IRPCConfig, TRPCMetaData, TRPCMetaFile } from '../common'
import { InterfaceDeclaration, Project, SyntaxKind } from 'ts-morph'
import { addNode, collectTypeDeps, ITCDeclaration } from './utils'
import { initMockServer } from './mock-server'

const program = new Command()

if (process.env.NODE_ENV !== 'test') {
  init()
}

const fsP = fs.promises

function init (): void {
  program.command('client')
    .description('客户端同步声明文件')
    .requiredOption('-c, --config <path>', '指定远端服务配置，用于获取RPC服务声明文件')
    .option('-ms, --mock-server', '是否启动 Mock Server')
    .action(async ({ config, mockServer }) => {
      try {
        const cfgPath = path.resolve(process.cwd(), config)
        const { client } = await import(cfgPath) as IRPCConfig
        if (client == null) {
          console.log(`${config as string} 未定义 client`)
          return
        }

        const outPath = path.resolve(
          path.dirname(cfgPath),
          client.genRPCDefintionTarget,
          'rpc-definition.ts'
        )
        let localDefStr = ''
        if (fs.existsSync(outPath)) {
          localDefStr = await fsP.readFile(outPath, { encoding: 'utf-8' })
        }

        const serverDts = await getServerDefinitionData(client.apps)
        const { code, appMeta } = await handleClientCmd(
          serverDts,
          localDefStr,
          { includeServices: client.includeServices }
        )
        if (!fs.existsSync(path.dirname(outPath))) {
          fs.mkdirSync(path.dirname(outPath))
        }

        fs.writeFileSync(outPath, `${code}`, { flag: 'w' })
        console.log('ts-brpc > 声明文件同步完成：', outPath)
        if (mockServer === true) {
          initMockServer({ cfgPath, clientCfg: client }, appMeta)
        }
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
          ? path.resolve(path.dirname(cfgPath), cfgMetaDir ?? './')
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

async function getServerDefinitionData (appsCfg: Record<string, string>): Promise<Record<string, { dts: string, meta: TRPCMetaData }>> {
  return (await Promise.all(
    Object.entries(appsCfg)
      .map(async ([k, v]) => {
        const url = `http://${v}/_rpc_definition_`
        return await got.get(url, {
          timeout: {
            lookup: 100,
            connect: 100,
            socket: 1000,
            send: 1000,
            response: 3000

          }
        })
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
    }), {})
}

/**
 * 从多个远程获取声明文件，然后与本地声明文件合并（覆盖）
 */
export async function handleClientCmd (
  serverDts: Record<string, { dts: string, meta: TRPCMetaData }>,
  localDefStr: string,
  { includeServices = [] }: { includeServices?: string[] }
): Promise<{ code: string, appMeta: Record<string, TRPCMetaData> }> {
  const prj = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      types: []
    }
  })
  const localSf = prj.createSourceFile('localDefstr.ts', localDefStr.trim())
  // 将本地文件内容 替换为 远端获取的内容（根据 appId 替换）
  Object.keys(serverDts).forEach((appId) => {
    localSf.getTypeAlias(appId)?.remove()
    localSf.getModule(`${appId}NS`)?.remove()
    localSf.getVariableDeclaration(`${appId}Meta`)?.remove()
  })
  const localMeta = localSf.getVariableDeclarations()
    .map(vd => ({
      appId: vd.getName().replace(/Meta$/, ''),
      meta: JSON.parse(
        vd.getChildrenOfKind(SyntaxKind.ArrayLiteralExpression)[0].getText()
      )
    }))
    .reduce((acc, cur) => ({ ...acc, [cur.appId]: cur.meta }), {})

  const newCodeStr = Object.values(serverDts)
    .map(({ dts }) => dts)
    .join('\n')

  let rsCodeStr = `${localSf.getFullText().trim()}\n${newCodeStr}`
  // 移除 dts 属性
  let appMeta = Object.fromEntries(
    Object.entries(serverDts).map(([appId, { meta }]) => [appId, meta])
  )
  appMeta = Object.assign({}, localMeta, appMeta)

  if (includeServices.length > 0) {
    const { code, meta } = filterService(
      rsCodeStr,
      appMeta,
      includeServices
    )
    rsCodeStr = code
    appMeta = meta
  }

  const metaStr = Object.entries(appMeta)
    .map(
      ([appId, meta]) => `export const ${appId}Meta = ${JSON.stringify(meta, null, 2)};`
    )
    .join('\n')

  const startComment = rsCodeStr.includes('/* eslint-disable */')
    ? ''
    : '/* eslint-disable */'

  // 合并 (注释 + 本地代码 + 同步的新代码)
  return {
    code: `${startComment}\n${rsCodeStr}\n${metaStr}`,
    appMeta
  }
}

export function filterService (
  code: string,
  appMeta: Record<string, TRPCMetaData>,
  includeServices: string[]
): { code: string, meta: Record<string, TRPCMetaData> } {
  const prj = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      types: []
    }
  })
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
      collectTypeDeps(
        (services as InterfaceDeclaration[]).map(
          s => s.getMethods()
            .map(m => [...m.getParameters(), m.getReturnTypeNodeOrThrow()])
        ).flat(2),
        prj
      )
    ])
    .forEach(([nsName, services, deps]) => {
      // 将保留的 [ns, service, serviceDeps]写入 output，生成代码
      const nsNameStr = nsName as string
      const ns = outSf.addModule({ name: nsNameStr })
      ns.setIsExported(true)
      outSf.addTypeAlias({
        // 移除’NS‘后缀
        name: nsNameStr.slice(0, -2),
        type: `${nsNameStr}.App`,
        isExported: true
      })

      const app = ns.addInterface({ name: 'App' })
      app.setIsExported(true)

      ;(services as InterfaceDeclaration[])
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

// TODO: 实现
export function cfgChecker (): boolean {
  return false
}
