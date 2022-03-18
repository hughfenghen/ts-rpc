import glob from 'glob'
import jsf, { Schema } from 'json-schema-faker'
import Koa from 'koa'
import { merge } from 'lodash'
import path from 'path'

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

  app.use(crossMiddleware)
  app.use(buildMockMiddleware(
    buildManualMockGenerator(safeMockCfg.fileMatch, opts.cfgPath).generator,
    buildAutoMockGenerator(Object.values(appMeta).flat())
  ))

  app.listen(safeMockCfg.port, () => {
    console.log(`mock server 已启动：${safeMockCfg.port}`)
  })
}

async function crossMiddleware (ctx: Ctx, next: () => Promise<void>): Promise<void> {
  ctx.set('Access-Control-Allow-Origin', '*')
  ctx.set('Access-Control-Allow-Headers', 'Content-Type')
  ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')

  if (ctx.method === 'OPTIONS') {
    ctx.status = 204
    return
  }
  await next()
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

    const manualMock = manualMockGenerator(sPath, mPath, await getRPCArgs(ctx))
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
  const cfgDir = path.dirname(cfgPath)
  const mockModules = fileMatch.map(fm => glob.sync(path.resolve(cfgDir, fm)))
    .flat()
    .map((filePath) => require(filePath))
    .reduce((acc, cur) => Object.assign(acc, cur), {})

  const servicesInstance: TServiceInsMap = {}
  for (const name in mockModules) {
    servicesInstance[name] = new mockModules[name]()
  }
  return {
    async generator (sName, mName, args) {
      return servicesInstance[sName]?.[mName]?.(...args)
    }
  }
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
