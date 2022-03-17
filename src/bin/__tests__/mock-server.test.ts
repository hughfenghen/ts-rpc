import path from 'path'
import { RPCKey, TRPCMetaData, TSchema } from '../../common'
import { buildMockGenerator, buildMockMiddleware, collectMockService } from '../mock-server'
import complexSchema from './data/complex-schema.data.json'

function createMeta (schema: TSchema): TRPCMetaData {
  return [{
    name: 'S',
    path: '',
    methods: [{
      name: 'M',
      decorators: [],
      retSchema: schema
    }]
  }]
}

test('buildMockGenerator', () => {
  const generator = buildMockGenerator(createMeta({
    type: 'array',
    items: {
      type: 'string'
    }
  }))

  const data = generator('S', 'M')
  expect(data).toBeInstanceOf(Array)
  expect(typeof data[0]).toBe('string')
})

test('generate complex mock data', () => {
  const generator = buildMockGenerator(createMeta(
    complexSchema as unknown as TSchema
  ))

  const data = generator('S', 'M')
  // 生成错误或具体的 Mock 数据
  expect(
    typeof data.data === 'object' ||
    typeof data.error === 'string'
  ).toBe(true)
})

test('collectMockService', async () => {
  const mockModules = await collectMockService(
    ['./data/mock*.js'],
    path.resolve(__dirname, './ts-rpc-example.json')
  )
  expect(mockModules.User).not.toBeUndefined()
})

test('buildMockMiddleware', async () => {
  const spyMethod = jest.fn().mockReturnValue({ code: 222 })
  const middleware = buildMockMiddleware(
    {
      User: {
        getInfoById: spyMethod
      }
    },
    () => ({ code: 111 })
  )
  const ctx = {
    method: 'GET',
    path: 'User/getInfoById',
    request: { query: { [RPCKey.Args]: '["id"]' } }
  } as any
  await middleware(ctx, async () => {})
  expect(JSON.parse(ctx.body)).toEqual({
    [RPCKey.Return]: { code: 222 }
  })
  expect(spyMethod).lastCalledWith('id')
})
