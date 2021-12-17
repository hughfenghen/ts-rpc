import fs from 'fs'
import path from 'path'
import { camelCase } from 'lodash'
import { RPCKey, TRPCMetaFile } from '../common'

interface Ctx {
  request: {
    body?: any
    query: { [key: string]: string }
  }
  body: string
  path: string
  set: (k: string, v: string) => void
  method: string
  status: number
}
type TMiddleware = (ctx: Ctx, next: (() => Promise<void>)) => Promise<void>

interface IApp {
  use: (middleware: TMiddleware) => void
}

interface IBindingArgs {
  app: IApp
  rpcMetaPath: string
  prefixPath: string
}

export async function bindKoa ({ app, rpcMetaPath, prefixPath }: IBindingArgs): Promise<void> {
  const { appId, dts, meta } = await import(rpcMetaPath) as TRPCMetaFile
  const rpcMetaDir = path.dirname(rpcMetaPath)
  const sNameExportMap = Object.fromEntries(
    await Promise.all(
      Array.from(new Set(meta.map(meta => [meta.path, meta.name])))
        .map(async ([serviceFilePath, serviceName]) => {
          let tsOrJsPath = path.resolve(rpcMetaDir, serviceFilePath)
          // 服务器上运行尝试加载对应的 js 文件
          if (
            tsOrJsPath.endsWith('.ts') &&
            !fs.existsSync(tsOrJsPath)
          ) {
            tsOrJsPath = tsOrJsPath.slice(0, -2) + 'js'
          }
          if (!fs.existsSync(tsOrJsPath)) {
            throw new Error(`Could not find RPC Service file: ${serviceFilePath} or ${tsOrJsPath}`)
          }
          return [
            serviceName,
            (await import(tsOrJsPath))[serviceName]
          ]
        })
    )
  )

  const pathInstanceMap = new Map<string, any>()
  app.use(async (ctx, next) => {
    if (path.resolve(prefixPath, '_rpc_definition_') === ctx.path) {
      ctx.body = JSON.stringify({
        appId,
        dts,
        meta
      })
      await next()
      return
    }

    let ins = pathInstanceMap.get(ctx.path)
    const [sPath, mPath] = ctx.path
      .replace(prefixPath, '')
      .replace(/^\/*/, '')
      .split('/')
    if (sNameExportMap[sPath] == null) {
      await next()
      return
    }

    ctx.set('Access-Control-Allow-Headers', 'Content-Type')
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')

    if (ctx.method === 'OPTIONS') {
      ctx.status = 204
      return
    }

    if (ins == null) {
      ins = new sNameExportMap[sPath]()
      pathInstanceMap.set(ctx.path, ins)
    }

    ins.ctx = ctx
    ctx.body = JSON.stringify(wrapRPCReturn(
      await ins[mPath](...getRPCArgs(ctx))
    ))
    await next()
  })
}

interface IMidwayApp extends IApp {
  getApplicationContext: () => { getAsync: (insName: string) => Promise<any> }
}

export async function bindMidway (
  { app, prefixPath, rpcMetaPath }: IBindingArgs & { app: IMidwayApp }
): Promise<void> {
  const container = app.getApplicationContext()
  const { appId, dts, meta } = await import(rpcMetaPath) as TRPCMetaFile
  const serviceNames = meta.map(({ name }) => name)

  const pathInstanceMap = new Map<string, any>()

  app.use(async (ctx, next) => {
    if (path.resolve(prefixPath, '_rpc_definition_') === ctx.path) {
      ctx.body = JSON.stringify({
        appId,
        dts,
        meta
      })
      await next()
      return
    }

    const [sPath, mPath] = ctx.path
      .replace(prefixPath, '')
      .replace(/^\/*/, '')
      .split('/') as [string, string]

    if (!serviceNames.includes(sPath)) {
      await next()
      return
    }

    ctx.set('Access-Control-Allow-Headers', 'Content-Type')
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')

    if (ctx.method === 'OPTIONS') {
      ctx.status = 204
      return
    }

    let ins = pathInstanceMap.get(ctx.path)
    if (ins == null) {
      ins = await container.getAsync(camelCase(sPath))
      pathInstanceMap.set(ctx.path, ins)
    }

    ctx.body = JSON.stringify(wrapRPCReturn(
      await ins[mPath](...getRPCArgs(ctx))
    ))
    await next()
  })
}

export function getRPCArgs (ctx: Ctx): unknown[] {
  const req = ctx.request
  const method = ctx.method.toLowerCase()
  let args = method === 'get'
    ? req?.query?.[RPCKey.Args]
    : req?.body?.[RPCKey.Args]

  try {
    if (typeof args === 'string') args = JSON.parse(args)
    if (!Array.isArray(args)) throw Error('Parse args failed')
  } catch (err) {
    console.warn(`Cannot find '${RPCKey.Args}' in request body or query, path: ${ctx.path}`)
    args = []
  }
  return args
}

function wrapRPCReturn<T extends unknown> (data: T): { [RPCKey.Return]: T } {
  return {
    [RPCKey.Return]: data
  }
}
