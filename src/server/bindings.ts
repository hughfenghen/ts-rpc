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
  console.log(1111, JSON.stringify(meta, null, 2), dts)
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
  console.log(34444, sNameExportMap)
  const pathInstanceMap = new Map<string, any>()
  app.use(async (ctx, next) => {
    let ins = pathInstanceMap.get(ctx.path)
    const [sPath, mPath] = ctx.path
      .replace(prefixPath, '')
      .replace(/^\/*/, '')
      .split('/')
    if (sNameExportMap[sPath] == null) {
      await next()
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
