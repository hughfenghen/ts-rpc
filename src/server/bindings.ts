import path from 'path'
import { IScanResult } from '../interface'

interface IKoaArgs {
  app: {
    use: (
      middleware: (ctx: any, next: (() => Promise<void>)) => Promise<void>
    ) => void
  }
  rpcMetaPath: string
  prefixPath: string
}

export async function bindKoa ({ app, rpcMetaPath, prefixPath }: IKoaArgs): Promise<void> {
  const { dts, meta } = await import(rpcMetaPath) as IScanResult
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
      ctx.body = dts
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

    const args = ctx.request?.body?._ts_rpc_args_
    if (args == null) {
      throw Error('Cannot find `_ts_rpc_args_` in request body')
    }
    ctx.body = JSON.stringify(await ins[mPath](...args))
    await next()
  })
}
