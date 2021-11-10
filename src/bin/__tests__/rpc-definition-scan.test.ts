import path from 'path'
import { MethodDeclaration, Project } from 'ts-morph'
import { collectMethodTypeDeps, collectTypeDeps, scan } from '../rpc-definition-scan'

test('scan', () => {
  const { dts, meta } = scan([path.resolve(__dirname, '*.ts')])

  expect(dts).toMatchSnapshot()
  expect(meta).toEqual([{
    name: 'User',
    path: expect.stringContaining('/src/bin/__tests__/controller-example.ts'),
    methods: [
      { name: 'getInfoById1' },
      { name: 'getInfoById2' },
      { name: 'getInfoById3' },
      { name: 'getUnreadMsg' }
    ]
  }, {
    name: 'Foo',
    path: expect.stringContaining('/src/bin/__tests__/controller-example.ts'),
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
    sf.getClass('Test')?.getMethod('foo') as MethodDeclaration,
    prj
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
  const iDeps = collectTypeDeps(sf.getInterfaceOrThrow('X'), prj)
  expect(iDeps.map(i => i.getName())).toEqual(['X', 'A', 'B'])

  const tDeps = collectTypeDeps(sf.getTypeAliasOrThrow('Y'), prj)
  expect(tDeps.map(t => t.getName())).toEqual(['Y', 'A', 'B'])
})
