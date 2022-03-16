import { buildMockGenerator } from '../mock-server'

test('buildMockGenerator', () => {
  const generator = buildMockGenerator(
    [{
      name: 'S',
      path: '',
      methods: [{
        name: 'M',
        decorators: [],
        retSchema: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }]
    }]
  )

  const data = generator('S', 'M')
  expect(data).toBeInstanceOf(Array)
  expect(typeof data[0]).toBe('string')
})
