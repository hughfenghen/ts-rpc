#!/usr/bin/env node

import { Command } from 'commander'
import path from 'path'

import fs from 'fs'
import got from 'got'
import { scan } from './rpc-definition-scan'
import { TRPCMetaFile } from '../interface'

const program = new Command()

if (process.env.NODE_ENV !== 'test') {
  init()
}

function init (): void {
  program.command('client')
    .description('客户端同步声明文件')
    .requiredOption('-c, --config <path>', '指定远端服务配置，用于获取RPC服务声明文件')
    .action(async ({ config }) => {
      let rpcServer: null | string = null
      try {
        const { client: { baseUrl } } = await import(path.resolve(process.cwd(), config))
        rpcServer = baseUrl

        console.log(`ts-brpc > 开始同步声明文件: http://${baseUrl as string}/_rpc_definition_`)

        const { body } = await got.get(`http://${baseUrl as string}/_rpc_definition_`)
        const { appId, dts } = JSON.parse(body) as { appId: string, dts: string}

        const outPath = path.resolve(__dirname, `../client/app/${appId}.ts`)
        const appPath = path.resolve(__dirname, '../client/app/')
        if (!fs.existsSync(appPath)) {
          fs.mkdirSync(appPath)
        }

        fs.writeFile(outPath, dts, { flag: 'w' }, (err) => {
          if (err != null) throw err
          console.log('ts-brpc > 声明文件同步成功：', outPath)
        })
      } catch (err) {
        console.error(`ts-brpc error > 声明文件同步失败，请检查RPC服务(${rpcServer ?? '配置解析失败'})是否正常运行`)
        console.error((err as Error).message)
      }
    })

  program.command('server')
    .description('服务端生成声明文件')
    .requiredOption('-c, --config <path>', '指定远端服务配置，用于获取RPC服务声明文件')
    .action(async ({ config }) => {
      try {
        console.log('ts-brpc > 开始扫描 RPCService')
        const cfgPath = path.resolve(process.cwd(), config)
        const { metaOutDir, metaFile } = await handleServerCmd(cfgPath)
        fs.writeFile(
          path.resolve(path.dirname(cfgPath), metaOutDir, '_rpc_gen_meta_.json'),
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

export async function handleServerCmd (cfgPath: string): Promise<{ metaOutDir: string, metaFile: TRPCMetaFile }> {
  const { appId, server } = await import(cfgPath)
  const scanData = scan(
    server.scanDir
      .map((p: string) => path.resolve(path.dirname(cfgPath), p))
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
