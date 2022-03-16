import { RPCKey } from '../common'
import { getRPCArgs } from '../protocol'

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

test('getRPCArgs for http Get request', async () => {
  const argsData = [1, '2', true]
  const args = await getRPCArgs({
    ...CTX_TPL,
    method: 'get',
    request: {
      query: {
        [RPCKey.Args]: JSON.stringify(argsData)
      }
    }
  })

  expect(args).toEqual(argsData)
})

test('getRPCArgs for http Post request', async () => {
  const argsData = [1, '2', true]
  const args = await getRPCArgs({
    ...CTX_TPL,
    method: 'post',
    request: {
      body: {
        [RPCKey.Args]: JSON.stringify(argsData)
      }
    }
  })

  expect(args).toEqual(argsData)
})
