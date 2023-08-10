import bodyParser from 'co-body'
import { Ctx, RPCKey } from './common'

export async function getRPCArgs (ctx: Ctx): Promise<unknown[]> {
  const ctxReq = ctx.request
  const method = ctx.method.toLowerCase()

  let args = null
  if (method === 'get') {
    args = ctxReq.query?.[RPCKey.Args]
  } else {
    if (ctxReq.body == null) {
      const ct = ctxReq.headers['content-type'] ?? 'application/json'
      if (ct.includes('application/json')) {
        ctxReq.body = await bodyParser.json(ctx as any)
      } else if (ct.includes('application/x-www-form-urlencoded')) {
        ctxReq.body = await bodyParser.form(ctx as any)
      }
    }
    args = ctxReq.body?.[RPCKey.Args]
  }

  if (typeof args === 'string') {
    // 只有字符串形式的数组才考虑 parse，检测是否需要 URL 解码
    if (args.startsWith('%5B')) args = decodeURIComponent(args)
    if (args.startsWith('[')) args = JSON.parse(args)
  }
  if (!Array.isArray(args)) throw Error('Args parsing failed')

  return args
}

export function wrapRPCReturn<T extends unknown> (data: T): { [RPCKey.Return]: T } {
  return {
    [RPCKey.Return]: data
  }
}
