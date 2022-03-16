import jsf, { Schema } from 'json-schema-faker'
import Koa from 'koa'

import { IRPCConfig, TRPCMetaData } from '../common'
import { wrapRPCReturn } from '../protocol'

export function initMockServer (clientCfg: IRPCConfig['client'], appMeta: Record<string, TRPCMetaData>): void {
  const safeMockCfg = Object.assign({ port: 3030 }, clientCfg?.mock)

  const app = new Koa()
  const generator = buildMockGenerator(Object.values(appMeta).flat())
  app.use(async (ctx, next) => {
    const [sPath, mPath] = ctx.path
      .replace(/^\/*/, '')
      .split('/')

    console.log(`access path: ${ctx.path}`)
    if (sPath == null || mPath == null) {
      await next()
      return
    }
    // const args = await getRPCArgs(ctx as Ctx)
    ctx.body = JSON.stringify(wrapRPCReturn(generator(sPath, mPath)))

    await next()
  })

  app.listen(safeMockCfg.port, () => {
    console.log(`mock server 已启动：${safeMockCfg.port}`)
  })
}

export function buildMockGenerator (meta: TRPCMetaData): (sName: string, mName: string) => any {
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
