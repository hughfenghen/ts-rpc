#!/usr/bin/env node

import { Command } from 'commander'
import path from 'path'

import fs from 'fs'
import got from 'got'
import { scan } from './rpc-definition-scan'

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

        console.log(`ts-brpc > 开始同步声明文件: http://${baseUrl as string}/_rpc_definiton_`)

        const resp = await got.get(`http://${baseUrl as string}/_rpc_definiton_`)
        const outPath = path.resolve(__dirname, '../client/__service-collection__.d.ts')
        fs.writeFile(outPath, resp.body, { flag: 'w' }, (err) => {
          if (err != null) throw err
          console.log('ts-brpc > 声明文件同步成功：', outPath)
        })
      } catch (err) {
        console.error(`ts-brpc error > 声明文件同步失败，请检查RPC服务(${rpcServer ?? '配置解析失败'})是否正常运行`)
      }
    })

  program.command('server')
    .description('服务端生成声明文件')
    .requiredOption('-c, --config <path>', '指定远端服务配置，用于获取RPC服务声明文件')
    .action(async ({ config }) => {
      try {
        console.log('ts-brpc > 开始扫描 RPCService')
        const cfgPath = path.resolve(process.cwd(), config)
        const { serverCfg, metaFileStr } = await handleServerCmd(cfgPath)
        fs.writeFile(
          path.resolve(path.dirname(cfgPath), serverCfg.metaOutDir, '_rpc_gen_meta_.json'),
          metaFileStr,
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

export async function handleServerCmd (cfgPath: string): Promise<{ serverCfg: any, metaFileStr: string }> {
  const { server } = await import(cfgPath)
  const scanData = scan(
    server.scanDir
      .map((p: string) => path.resolve(path.dirname(cfgPath), p))
  )
  scanData.meta = scanData.meta.map(m => ({
    ...m,
    path: path.relative(path.dirname(cfgPath), m.path)
  }))
  return {
    serverCfg: server,
    metaFileStr: JSON.stringify(scanData, null, 2)
  }
}
