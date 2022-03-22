import jsf, { Schema } from 'json-schema-faker'
import Koa from 'koa'
import { merge } from 'lodash'
import path from 'path'
import chokidar from 'chokidar'
import cors from '@koa/cors'

import { Ctx, IRPCConfig, TRPCMetaData } from '../common'
import { getRPCArgs, wrapRPCReturn } from '../protocol'

type TServiceInsMap = Record<string, Record<string, (...args: unknown[]) => unknown>>
type TGeneragor = (sName: string, mName: string, args: unknown[]) => Promise<unknown>

export function initMockServer (
  opts: { cfgPath: string, clientCfg: IRPCConfig['client'] },
  appMeta: Record<string, TRPCMetaData>
): void {
  const safeMockCfg = Object.assign({
    port: 3030,
    fileMatch: []
  }, opts.clientCfg?.mock)

  const app = new Koa()

  app.use(cors({
    origin: ctx => ctx.header.origin as string,
    credentials: true
  }))
  app.use(buildMockMiddleware(
    buildManualMockGenerator(safeMockCfg.fileMatch, opts.cfgPath).generator,
    buildAutoMockGenerator(Object.values(appMeta).flat())
  ))

  app.listen(safeMockCfg.port, () => {
    console.log(`mock server 已启动：${safeMockCfg.port}`)
  })
}

export function buildMockMiddleware (
  manualMockGenerator: TGeneragor,
  autoGenerator: (sName: string, mName: string) => unknown
): (ctx: Ctx, next: () => Promise<void>) => Promise<void> {
  return async (ctx, next) => {
    const [sPath, mPath] = ctx.path
      .replace(/^\/*/, '')
      .split('/')

    console.log(`access path: ${ctx.path}`)
    if (sPath == null || mPath == null) {
      await next()
      return
    }

    const manualMock = await manualMockGenerator(sPath, mPath, await getRPCArgs(ctx))
    ctx.body = JSON.stringify(
      wrapRPCReturn(
        // 手动 mock 数据优先级高于自动生成的数据
        merge(autoGenerator(sPath, mPath), manualMock)
      )
    )

    await next()
  }
}

export function buildManualMockGenerator (fileMatch: string[], cfgPath: string): {
  generator: TGeneragor
} {
  // 初始时获取 mock 文件中的实例
  const globPatterns = fileMatch.map(fm => path.resolve(
    path.dirname(cfgPath),
    fm
  ))

  const servicesInstance: TServiceInsMap = {}
  // 监听手写 mock 文件变化，覆盖合并当前mock实例
  const onFileChange = (filePath: string): void => {
    console.log(`mock server reload: ${filePath}`)
    Object.assign(servicesInstance, file2MockIns(filePath))
  }
  chokidar.watch(globPatterns)
    .on('add', onFileChange)
    .on('change', onFileChange)

  return {
    async generator (sName, mName, args) {
      return servicesInstance[sName]?.[mName]?.(...args)
    }
  }
}

export function file2MockIns (filePath: string): TServiceInsMap {
  // eslint-disable-next-line
    delete require.cache[require.resolve(filePath)]
  // eslint-disable-next-line
    const module = require(filePath)
  const servicesInstance: TServiceInsMap = {}
  for (const name in module) {
    const Class = module[name]
    if (Class instanceof Function) {
      servicesInstance[name] = new Class()
    }
  }
  return servicesInstance
}

export function buildAutoMockGenerator (meta: TRPCMetaData): (sName: string, mName: string) => any {
  // 不需要生成多余的属性
  jsf.option({ fillProperties: false })

  return (sName, mName) => {
    const schema = meta.find(({ name }) => name === sName)
      ?.methods
      .find(({ name }) => name === mName)
      ?.retSchema
    if (schema == null) {
      throw new Error(`Schema not found for Service: ${sName}, Method: ${mName}`)
    }
    return jsf.generate(schema as Schema)
  }
}
