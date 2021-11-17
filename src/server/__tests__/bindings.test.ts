import path from 'path'
import { bindKoa } from '../bindings'

jest.mock('lodash-es', () => ({
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
    request: { body: { _ts_rpc_args_: ['111'] } },
    set: () => {}
  }, spyNext)
  expect(spyNext).toBeCalled()
})
