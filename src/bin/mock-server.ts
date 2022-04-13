import jsf, { Schema } from 'json-schema-faker'
import Mock from 'mockjs'
import Koa from 'koa'
import { merge } from 'lodash'
import path from 'path'
import chokidar from 'chokidar'
import cors from '@koa/cors'

import { Ctx, IRPCConfig, TRPCMetaData } from '../common'
import { getRPCArgs, wrapRPCReturn } from '../protocol'

type TServiceInsMap = Record<string, Record<string, (...args: unknown[]) => unknown>>
type TGeneragor = (sName: string, mName: string, args: unknown[]) => Promise<unknown>

/**
 * 方便配置Mock的类型结构： [matchType, matchName, mockjsTpl | generator]
 */
type TFiledMockRules = Array<[string | RegExp, string | RegExp, unknown]>
/**
 * 根据MockRule生成精准数据的函数
 */
type TFiledFormatter = (type: string, keyName: string) => unknown

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
  const { generator, formatter } = buildManualMockGenerator(
    safeMockCfg.fileMatch,
    opts.cfgPath
  )
  app.use(buildMockMiddleware(
    generator,
    buildAutoMockGenerator(
      Object.values(appMeta).flat(),
      formatter
    )
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
  formatter: TFiledFormatter
} {
  // 初始时获取 mock 文件中的实例
  const globPatterns = fileMatch.map(fm => path.resolve(
    path.dirname(cfgPath),
    fm
  ))

  const servicesInstance: TServiceInsMap = {}
  const pathFmt: Record<string, TFiledMockRules> = {}
  // 监听手写 mock 文件变化，覆盖合并当前mock实例
  const onFileChange = (filePath: string): void => {
    console.log(`mock server reload: ${filePath}`)
    const { servicesInstance: newIns, fieldFormatterCfg } = file2MockIns(filePath)

    Object.assign(servicesInstance, newIns)
    if (fieldFormatterCfg instanceof Array) {
      pathFmt[filePath] = fieldFormatterCfg
    }
  }
  chokidar.watch(globPatterns)
    .on('add', onFileChange)
    .on('change', onFileChange)

  function match (m: string | RegExp, v: string): boolean {
    return typeof m === 'string'
      ? m === v
      : m instanceof RegExp
        ? m.test(v)
        : false
  }

  return {
    async generator (sName, mName, args) {
      return servicesInstance[sName]?.[mName]?.(...args)
    },
    formatter (type, keyName) {
      for (
        const [typeMath, nameMath, mockTpl] of Object.values(pathFmt).flat()
      ) {
        if (
          !match(typeMath, type) ||
          !match(nameMath, keyName)
        ) continue

        const mockVal = typeof mockTpl === 'string'
          ? Mock.mock(mockTpl)
          : mockTpl instanceof Function
            ? mockTpl()
            : mockTpl

        if (mockVal !== undefined) return mockVal
      }
    }
  }
}

export function file2MockIns (filePath: string): {
  servicesInstance: TServiceInsMap
  fieldFormatterCfg: TFiledMockRules | null
} {
  // 热加载 mock 文件，需要清除 require 缓存
  // eslint-disable-next-line
  delete require.cache[require.resolve(filePath)]
  // eslint-disable-next-line
  const module = require(filePath)
  const servicesInstance: TServiceInsMap = {}
  let fieldFormatterCfg: TFiledMockRules | null = null

  for (const name in module) {
    if (name === 'rpcMockRules') {
      fieldFormatterCfg = module[name] as TFiledMockRules ?? null
      continue
    }
    const Class = module[name]
    if (Class instanceof Function) {
      try {
        servicesInstance[name] = new Class()
      } catch (err) {
        console.error(err)
      }
    }
  }
  return {
    servicesInstance,
    fieldFormatterCfg
  }
}

export function buildAutoMockGenerator (
  meta: TRPCMetaData,
  formatter: TFiledFormatter
): (sName: string, mName: string) => any {
  // 不需要生成多余的属性
  jsf.option({ fillProperties: false })
  jsf.define('type', (type, schema, prop, rootSchema, path) => {
    const keyName = path.slice(-1)[0]
    if (keyName == null) return undefined
    return formatter(type as string, keyName) as any
  })

  return (sName, mName) => {
    const schema = meta.find(({ name }) => name === sName)
      ?.methods
      .find(({ name }) => name === mName)
      ?.retSchema
    if (schema == null) {
      console.warn(`Schema not found for Service: ${sName}, Method: ${mName}`)
      return null
    }
    return jsf.generate(schema as Schema)
  }
}
