import path from 'path'
import jsf from 'json-schema-faker'
import { RPCKey, TRPCMetaData, TSchema } from '../../common'
import { buildAutoMockGenerator, buildMockMiddleware, buildManualMockGenerator, file2MockIns } from '../mock-server'
import complexSchema from './data/complex-schema.data.json'

jest.mock('chokidar', () => ({
  __esModule: true,
  default: {
    watch: () => new class {
      on (evtType: string, handler: (fp: string) => void): any {
        handler(path.resolve(__dirname, './data/mock-file-example.js'))
        return this
      }
    }()
  }
}))

afterEach(() => {
  jsf.reset('type')
})

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
  }),
  () => {}
  )

  const data = generator('S', 'M')

  expect(data).toBeInstanceOf(Array)
  expect(typeof data[0]).toBe('string')
})

test('beautify mock data', () => {
  const { formatter } = buildManualMockGenerator(
    ['./data/mock*.js'],
    path.resolve(__dirname, './ts-rpc-example.json')
  )
  const generator = buildAutoMockGenerator(createMeta({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: {
          type: 'string'
        },
        name: {
          type: 'string'
        },
        age: {
          type: 'number'
        },
        avatar: {
          type: 'string'
        }
      },
      required: ['id', 'name', 'age', 'avatar']
    }
  }),
  formatter
  )

  const data = generator('S', 'M')
  expect(data).toBeInstanceOf(Array)
  expect(data[0].name).toBe('张三')
})

test('generate complex mock data', () => {
  const generator = buildAutoMockGenerator(createMeta(
    complexSchema as unknown as TSchema
  ),
  () => {}
  )

  const data = generator('S', 'M')
  // 生成错误或具体的 Mock 数据
  expect(
    typeof data.data === 'object' ||
    typeof data.error === 'string'
  ).toBe(true)
})

test('buildManualMockGenerator', async () => {
  const { generator, formatter } = await buildManualMockGenerator(
    ['./data/mock*.js'],
    path.resolve(__dirname, './ts-rpc-example.json')
  )

  expect(generator).toBeInstanceOf(Function)

  // 示例 Mock 配置
  expect(formatter('string', 'name')).toBe('张三')

  expect((formatter('string', 'avatar') as string).endsWith('100x100'))
    .toBe(true)

  expect(typeof formatter('boolean', 'isXXX')).toBe('boolean')

  expect(formatter('number', 'score')).toBeGreaterThanOrEqual(0)

  expect(formatter('number', 'score')).toBeLessThanOrEqual(100)

  expect(/(\d+\.){3}\d+/.test(formatter('string', 'clientIp') as string))
    .toBe(true)

  expect(/\d{4}(-\d{2}){2}/.test(formatter('string', 'showTime') as string))
    .toBe(true)

  // 有效时间戳
  expect(formatter('number', 'time')).toBeGreaterThanOrEqual(Date.now() - 1000)
})

test('file2MockIns', () => {
  const { servicesInstance: { User }, fieldFormatterCfg } = file2MockIns(path.resolve(
    __dirname,
    './data/mock-file-example.js'
  ))
  expect(User.getInfoById(111)).toEqual({ id: 111 })
  expect(fieldFormatterCfg).toBeInstanceOf(Array)
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
