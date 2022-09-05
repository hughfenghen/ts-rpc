import path from 'path'
import { RPCKey } from '..'
import { bindKoa, bindMidway } from '../bindings'

jest.mock('lodash', () => ({
  __esModule: true,
  camelCase: () => ''
}))

const CTX_TPL = {
  status: 200,
  body: '',
  path: '/',
  set: () => { },
  method: 'post',
  request: {
    body: {},
    query: {}
  }
}

test('bindKoa', async () => {
  const middlewares: Function[] = []
  const spyUse = jest.fn((middleware) => {
    middlewares.push(middleware)
  })
  await bindKoa({
    app: { use: spyUse },
    rpcMetaPath: path.resolve(__dirname, './_rpc_gen_meta_.json'),
    prefixPath: '/test'
  })
  expect(spyUse).toBeCalled()
  expect(middlewares.length).toBe(1)

  const spyNext = jest.fn()
  await middlewares[0]({
    ...CTX_TPL,
    path: '/test/User/getInfoById',
    request: { body: { [RPCKey.Args]: ['111'] } }
  }, spyNext)
  expect(spyNext).toBeCalled()
})

test('bindKoa can not find file', async () => {
  const middlewares: Function[] = []
  const spyUse = jest.fn((middleware) => {
    middlewares.push(middleware)
  })

  try {
    await bindKoa({
      app: { use: spyUse },
      rpcMetaPath: path.resolve(__dirname, './error_meta.json'),
      prefixPath: '/test'
    })
  } catch (err) {
    expect(
      (err as Error).message.startsWith('Could not find RPC Service file:')
    ).toBe(true)
    return
  }
  throw new Error('not catch error')
})

test('bindKoa undeclare method', async () => {
  const middlewares: Function[] = []
  const spyUse = jest.fn((middleware) => {
    middlewares.push(middleware)
  })
  await bindKoa({
    app: { use: spyUse },
    rpcMetaPath: path.resolve(__dirname, './_rpc_gen_meta_.json'),
    prefixPath: '/test'
  })

  try {
    await middlewares[0]({
      ...CTX_TPL,
      path: '/test/User/invalidmethod',
      request: { body: { [RPCKey.Args]: ['111'] } }
    }, jest.fn())
  } catch (err) {
    expect(String(err)).toBe('Error: Undeclare method: User/invalidmethod')
  }
})

test('bindMidway', async () => {
  const middlewares: Function[] = []
  const spyUse = jest.fn((middleware) => {
    middlewares.push(middleware)
  })
  const spyGetInfoById = jest.fn().mockReturnValue('test')
  const spyGetAppCtx = jest.fn().mockReturnValue({
    getAsync: async () => {
      return {
        getInfoById: spyGetInfoById
      }
    }
  })

  await bindMidway({
    app: { use: spyUse, getApplicationContext: spyGetAppCtx },
    rpcMetaPath: path.resolve(__dirname, './_rpc_gen_meta_.json'),
    prefixPath: '/test'
  })
  expect(spyUse).toBeCalled()
  expect(middlewares.length).toBe(1)
  expect(spyGetAppCtx).toBeCalled()

  const spyNext = jest.fn()
  const ctx = {
    ...CTX_TPL,
    path: '/test/User/getInfoById',
    request: { body: { [RPCKey.Args]: ['111'] } }
  }
  await middlewares[0](ctx, spyNext)
  expect(spyNext).toBeCalled()
  // args from RPCKey.Args
  expect(spyGetInfoById).lastCalledWith('111')
  expect(JSON.parse(ctx.body)).toEqual({ [RPCKey.Return]: 'test' })
})
