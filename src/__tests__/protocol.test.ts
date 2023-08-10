import { Ctx, RPCKey } from '../common'
import { getRPCArgs } from '../protocol'

type CtxMock = Ctx &{
  request: {
    // 用于存放body原文，实际运行中的原文是通过流解析得到的，不方便 mock
    _body: string
  }
}
jest.mock('co-body', () => {
  return {
    json (ctx: CtxMock) {
      return JSON.parse(ctx.request._body)
    },
    form (ctx: CtxMock) {
      return Object.fromEntries(
        ctx.request._body.split('&')
          .map(fragment => fragment.split('='))
          .map(([k, v]) => [k, decodeURIComponent(v)])
      )
    }
  }
})

const CTX_TPL = {
  status: 200,
  body: '',
  path: '/',
  set: () => { },
  method: 'post',
  request: {
    query: {}
  }
}

test('getRPCArgs for http Get request', async () => {
  const argsData = [1, '2', true]
  const args = await getRPCArgs({
    ...CTX_TPL,
    method: 'get',
    request: {
      query: {
        [RPCKey.Args]: JSON.stringify(argsData)
      },
      headers: {}
    }
  })

  expect(args).toEqual(argsData)
})

test('getRPCArgs for http Post request(json)', async () => {
  const argsData = [1, '2', true]
  const args = await getRPCArgs({
    ...CTX_TPL,
    method: 'post',
    request: {
      ['_body' as any]: JSON.stringify({
        [RPCKey.Args]: argsData
      }),
      headers: {}
    }
  })

  expect(args).toEqual(argsData)
})

test('getRPCArgs for http Post request(form)', async () => {
  const argsData = [1, '2', true]
  const args = await getRPCArgs({
    ...CTX_TPL,
    method: 'post',
    request: {
      ['_body' as any]: `${RPCKey.Args}=${encodeURIComponent(JSON.stringify(argsData))}`,
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    }
  })
  expect(args).toEqual(argsData)
})


test('auto decodeURI args', async () => {
  const argsData = [1, '2', true]
  const args = await getRPCArgs({
    ...CTX_TPL,
    method: 'get',
    request: {
      query: {
        [RPCKey.Args]: encodeURIComponent(JSON.stringify(argsData))
      },
      headers: {}
    }
  })
  expect(args).toEqual(argsData)
})
