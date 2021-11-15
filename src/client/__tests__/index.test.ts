/**
 * @jest-environment jsdom
 */
import { createRetmoteService } from '..'

const spyFetch = jest.fn().mockResolvedValue({ json: () => ({}) })
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

test('createRetmoteService default node agent', async () => {
  const rs = createRetmoteService({
    baseUrl: '//localhost:3000/'
  }) as any

  // 模拟 node 环境
  window.fetch = undefined as any
  const info = rs.User.getInfoById('111')
  // setTimeout 为了让微任务都执行完
  setTimeout(() => {
    const [, , resCb] = spyRequest.mock.calls[0]
    resCb({
      statusCode: 200,
      on (_: string, dataHandler: Function) {
        dataHandler('{"data": "hi"}')
      }
    })
  }, 0)
  expect(await info).toEqual({ data: 'hi' })
  window.fetch = spyFetch
})

test('createRetmoteService default browser agent', async () => {
  const rs = createRetmoteService({
    baseUrl: '//localhost:3000/'
  }) as any

  const info = rs.User.getInfoById('111')
  // setTimeout 为了让微任务都执行完
  expect(await info).toEqual({})
})

test('createRetmoteService custom agent', async () => {
  const spyAgent = jest.fn().mockResolvedValue({})
  const rs = createRetmoteService({
    baseUrl: '//localhost:3000/',
    agent: spyAgent
  }) as any
  expect(await rs.User.getInfoById('111')).toEqual({})
  expect(spyAgent.mock.calls[0][0]).toEqual({
    serviceName: 'User',
    methodName: 'getInfoById',
    args: ['111']
  })
})
