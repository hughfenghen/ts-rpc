import path from 'path'
import { camelCase } from 'lodash'
import { TRPCMetaFile } from '../interface'

type TMiddleware = (ctx: any, next: (() => Promise<void>)) => Promise<void>

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
        .map(async ([serviceFilePath, serviceName]) => [
          serviceName,
          (await import(path.resolve(rpcMetaDir, serviceFilePath)))[serviceName]
        ])
    )
  )

  const pathInstanceMap = new Map<string, any>()
  app.use(async (ctx, next) => {
    if (path.resolve(prefixPath, '_rpc_definiton_') === ctx.path) {
      ctx.body = JSON.stringify({
        appId,
        dts
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
      ins.ctx = ctx
      pathInstanceMap.set(ctx.path, ins)
    }

    const args = ctx.request?.body?._ts_rpc_args_
    if (args == null) {
      throw Error('Cannot find `_ts_rpc_args_` in request body')
    }
    ctx.body = JSON.stringify(await ins[mPath](...args))
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
    if (path.resolve(prefixPath, '_rpc_definiton_') === ctx.path) {
      ctx.body = JSON.stringify({
        appId,
        dts
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

    const args = ctx.request?.body?._ts_rpc_args_ ?? []
    ctx.body = JSON.stringify(await ins[mPath](...args))
    await next()
  })
}
