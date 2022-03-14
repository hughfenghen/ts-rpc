import fs from 'fs'
import path from 'path'
import { dts2JSONSchema } from '../dts-to-schema'

test('interface to json schema', () => {
  const schema = dts2JSONSchema(`
    export interface Shape {
      /**
       * The size of the shape.
       *
       * @minimum 0
       * @TJS-type integer
       */
      size: number;
    }
  `, 'Shape')
  expect(schema).toMatchObject({
    properties: {
      size: { type: 'integer' }
    }
  })
})

test('complex definition file to json schema', () => {
  const schema = dts2JSONSchema(fs.readFileSync(
    path.resolve(__dirname, './data/complex-definition-code.data.ts')
  ).toString(), 'fuxiNS.APIReturnTypes') as unknown as any

  const methodRsTypeSchema = schema.properties['AwardService.getRewardConfigData']
  expect(methodRsTypeSchema.anyOf[0].properties.data.properties.rewardList.type).toBe('array')
  expect(methodRsTypeSchema.anyOf[1].properties.error.type).toBe('string')
})
