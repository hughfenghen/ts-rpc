import { TRPCMetaData, TSchema } from '../../common'
import { buildMockGenerator } from '../mock-server'
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
