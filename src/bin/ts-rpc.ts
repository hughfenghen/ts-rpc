#!/usr/bin/env node

import { Command } from 'commander'
import path from 'path'

import fs from 'fs'
import got from 'got'

const program = new Command()

program.requiredOption('-c, --config <path>', '指定远端服务配置，用于获取RPC服务声明文件')
  .action(async ({ config }) => {
    const { baseUrl } = await import(path.resolve(process.cwd(), config))
    console.log(111222, `http://${baseUrl as string}/_rpc_definiton_`)
    const resp = await got.get(`http://${baseUrl as string}/_rpc_definiton_`)
    fs.writeFile(path.resolve(__dirname, '../client/__service-collection__.d.ts'), resp.body, { flag: 'w' }, (err) => {
      if (err != null) throw err
    })
  })
  .parse()
