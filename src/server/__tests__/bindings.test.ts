import path from 'path'
import { bindKoa } from '../bindings'

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
  await middlewares[0]({
    path: '/test/User/getInfoById',
    request: { body: { _ts_rpc_args_: ['111'] } }
  }, () => {})
})
