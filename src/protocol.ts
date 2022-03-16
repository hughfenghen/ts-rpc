import bodyParser from 'co-body'
import { Ctx, RPCKey } from './common'

export async function getRPCArgs (ctx: Ctx): Promise<unknown[]> {
  const ctxReq = ctx.request
  const method = ctx.method.toLowerCase()

  let args = null
  if (method === 'get') {
    args = ctxReq.query?.[RPCKey.Args]
  } else {
    // bodyParser 依赖 koa, midway ctx.req (http.IncomingMessage)
    if (ctxReq.body == null) ctxReq.body = await bodyParser.json((ctx as any).req)
    args = ctxReq.body?.[RPCKey.Args]
  }

  if (typeof args === 'string') args = JSON.parse(args)
  if (!Array.isArray(args)) throw Error('Parse args failed')

  return args
}

export function wrapRPCReturn<T extends unknown> (data: T): { [RPCKey.Return]: T } {
  return {
    [RPCKey.Return]: data
  }
}
