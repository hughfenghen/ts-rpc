import path from 'path'
import { MethodDeclaration, Project } from 'ts-morph'
import { collectMethodTypeDeps, collectTypeDeps, startRPCDefinitionServer } from '../rpc-definition-server'

test('startRPCDefinitionServer', () => {
  const server = startRPCDefinitionServer(path.resolve(__dirname, 'controller-example.ts'))

  const { dts, meta } = server()
  expect(dts).toMatchSnapshot()
  expect(meta).toEqual([{
    name: 'User',
    methods: [
      { name: 'getInfoById' },
      { name: 'getUnreadMsg' },
    ]
  }, {
    name: 'Foo',
    methods: [{ name: 'bar' }]
  }])
})

test('collectMethodTypeDeps', () => {
  const prj = new Project({ compilerOptions: { declaration: true } })
  const sf = prj.createSourceFile('test.ts', `
    interface A {}
    type B {}
    interface Z {}

    class Test {
      foo (a: A, b: B, c: string): Z {}
    }
  `)

  const deps = collectMethodTypeDeps(
    sf.getClass('Test')?.getMethod('foo') as MethodDeclaration
  )
  expect(deps.map(d => d.getName())).toEqual(['A', 'B', 'Z'])
})

test('collectTypeDeps', () => {
  const prj = new Project({ compilerOptions: { declaration: true } })
  const sf = prj.createSourceFile('test.ts', `
    interface A {
      b: B
    }
    interface B {
      a: A
    }

    interface X {
      a: A
      b: B
      ab: A | B
      s: string
      n: number
      f: () => any
    }
    type Y = A | B | null | undefined
  `)
  const iDeps = collectTypeDeps(sf.getInterfaceOrThrow('X'))
  expect(iDeps.map(i => i.getName())).toEqual(['X', 'A', 'B'])

  const tDeps = collectTypeDeps(sf.getTypeAliasOrThrow('Y'))
  expect(tDeps.map(t => t.getName())).toEqual(['Y', 'A', 'B'])
})
