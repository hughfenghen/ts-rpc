/**
 * @jest-environment jsdom
 */
import { createRetmoteService } from '..'

global.Request = jest.fn()

const spyFetch = jest.fn().mockResolvedValue({ json: () => ({}) })
global.fetch = spyFetch

test('createRetmoteService default agent', async () => {
  const rs = createRetmoteService({
    baseUrl: '//localhost:3000/'
  }) as any
  expect(await rs.User.getInfoById('111')).toEqual({})
  expect(spyFetch.mock.calls[0][0]).toBeInstanceOf(global.Request)
})

test('createRetmoteService custom agent', async () => {
  const spyAgent = jest.fn().mockResolvedValue({ json: () => ({}) })
  const rs = createRetmoteService({
    baseUrl: '//localhost:3000/',
    agent: spyAgent
  }) as any
  expect(await rs.User.getInfoById('111')).toEqual({})
  expect(spyAgent.mock.calls[0][0]).toBeInstanceOf(global.Request)
})
