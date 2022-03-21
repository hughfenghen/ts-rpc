import path from 'path'
import { RPCKey, TRPCMetaData, TSchema } from '../../common'
import { buildAutoMockGenerator, buildMockMiddleware, buildManualMockGenerator, file2MockIns } from '../mock-server'
import complexSchema from './data/complex-schema.data.json'

jest.mock('chokidar', () => ({
  __esModule: true,
  default: {
    watch: () => new class {
      on (): any {
        return this
      }
    }()
  }
}))

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

test('buildAutoMockGenerator', () => {
  const generator = buildAutoMockGenerator(createMeta({
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
  const generator = buildAutoMockGenerator(createMeta(
    complexSchema as unknown as TSchema
  ))

  const data = generator('S', 'M')
  // 生成错误或具体的 Mock 数据
  expect(
    typeof data.data === 'object' ||
    typeof data.error === 'string'
  ).toBe(true)
})

test('buildManualMockGenerator', async () => {
  const { generator } = await buildManualMockGenerator(
    ['./data/mock*.js'],
    path.resolve(__dirname, './ts-rpc-example.json')
  )

  expect(generator).toBeInstanceOf(Function)
})

test('file2MockIns', () => {
  const { User } = file2MockIns(path.resolve(__dirname, './data/mock-file-example.js'))
  expect(User.getInfoById(111)).toEqual({ id: 111 })
})

test('buildMockMiddleware', async () => {
  const spyGen = jest.fn().mockResolvedValue({ code: 222 })
  const middleware = buildMockMiddleware(
    spyGen,
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
  expect(spyGen).lastCalledWith('User', 'getInfoById', ['id'])
})
