import { Project } from 'ts-morph'
import * as TJS from 'typescript-json-schema'
import { TSchema } from '../common'

export function dts2JSONSchema (code: string, typeName: string): TSchema | null {
  const prj = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      types: []
    }
  })
  prj.createSourceFile('rpc-definition.ts', code)

  const generator = TJS.buildGenerator(
    prj.getProgram().compilerObject as any,
    {
      include: ['rpc-definition.ts'],
      ignoreErrors: true,
      required: true,
      ref: false
    },
    ['rpc-definition.ts']
  )

  return generator?.getSchemaForSymbol(typeName) ?? null
}
