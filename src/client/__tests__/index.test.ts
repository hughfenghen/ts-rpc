/**
 * @jest-environment jsdom
 */
import { createRetmoteService, RPCKey } from '..'

const spyFetch = jest.fn().mockResolvedValue({
  json: () => ({
    [RPCKey.Return]: {}
  })
})
global.fetch = spyFetch

const spyRequest = jest.fn().mockReturnValue({
  on: jest.fn(),
  write: jest.fn(),
  end: jest.fn()
})

jest.mock('http', () => ({
  __esModule: true,
  request: spyRequest
}))

interface TestApp {
  User: { getInfoById: (id: string) => Promise<{data: string}> }
}
test('createRetmoteService default node agent', async () => {
  const rs = createRetmoteService<TestApp>({
    baseUrl: '//localhost:3000/'
  })

  // 模拟 node 环境
  window.fetch = undefined as any
  const info = rs.User.getInfoById('111')
  const mockrsStr = JSON.stringify({ [RPCKey.Return]: { data: 'hi' } })
  // setTimeout 为了让微任务都执行完
  setTimeout(() => {
    const [, , resCb] = spyRequest.mock.calls[0]
    let onData: Function = (): void => {}
    let onEnd: Function = (): void => {}
    resCb({
      statusCode: 200,
      on (evtName: string, handler: Function) {
        if (evtName === 'data') {
          onData = handler
        } else if (evtName === 'end') {
          onEnd = handler
        }
      }
    })
    // 模拟内容过大，data分片的情况
    onData(mockrsStr.slice(0, mockrsStr.length / 2))
    onData(mockrsStr.slice(mockrsStr.length / 2))
    onEnd()
  }, 0)

  expect(await info).toEqual({ data: 'hi' })
  window.fetch = spyFetch
})

test('createRetmoteService default browser agent', async () => {
  const rs = createRetmoteService<TestApp>({
    baseUrl: '//localhost:3000/'
  })

  const info = rs.User.getInfoById('111')
  // setTimeout 为了让微任务都执行完
  expect(await info).toEqual({})
})

test('createRetmoteService custom agent', async () => {
  const spyAgent = jest.fn().mockResolvedValue({})
  const rs = createRetmoteService<TestApp>({
    baseUrl: '//localhost:3000/',
    agent: spyAgent
  }) as any
  expect(await rs.User.getInfoById('111')).toEqual({})
  expect(spyAgent.mock.calls[0][0]).toEqual({
    serviceName: 'User',
    methodName: 'getInfoById',
    args: ['111'],
    meta: {}
  })
})

test('add meta data to custom agent args', async () => {
  const spyAgent = jest.fn()
  const mockMeta = { decorators: ['@Post()'] }
  const rs = createRetmoteService<TestApp>({
    baseUrl: '//localhost:3000/',
    meta: [{
      name: 'User',
      path: '/',
      methods: [{
        name: 'getInfoById',
        ...mockMeta
      }]
    }],
    agent: spyAgent
  })

  await rs.User.getInfoById('111')
  expect(spyAgent.mock.calls[0][0].meta).toEqual(mockMeta)
})
