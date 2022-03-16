import jsf, { Schema } from 'json-schema-faker'
// import Koa from 'koa'

import { TRPCMetaData } from '../common'

// const app = new Koa()

// app.use(async (ctx, next) => {

// })

// export function init (): void {

// }

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
