import path from 'path'
import { RPCKey } from '..'
import { bindKoa, bindMidway } from '../bindings'

jest.mock('lodash', () => ({
  __esModule: true,
  camelCase: () => ''
}))

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
    path: '/test/User/getInfoById',
    request: { body: { [RPCKey.Args]: ['111'] } },
    set: () => {}
  }, spyNext)
  expect(spyNext).toBeCalled()
})

test('bindMidway', async () => {
  const middlewares: Function[] = []
  const spyUse = jest.fn((middleware) => {
    middlewares.push(middleware)
  })
  const spyGetInfoById = jest.fn()
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
  await middlewares[0]({
    path: '/test/User/getInfoById',
    request: { body: { [RPCKey.Args]: ['111'] } },
    set: () => { }
  }, spyNext)
  expect(spyNext).toBeCalled()
  // args from RPCKey.Args
  expect(spyGetInfoById).lastCalledWith('111')
})
