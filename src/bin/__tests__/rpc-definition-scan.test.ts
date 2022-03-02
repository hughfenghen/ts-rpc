import path from 'path'
import { Project, MethodDeclaration } from 'ts-morph'
import { scan } from '../rpc-definition-scan'
import { collectTypeDeps } from '../utils'

console.warn = jest.fn()

test('scan', () => {
  const { dts, meta } = scan([path.resolve(__dirname, '*.ts')], 'ScanTest', {
    tsConfigFilePath: path.resolve(__dirname, 'tsconfig.json')
  })

  expect(dts).toMatchSnapshot()
  expect(meta).toEqual([{
    name: 'User',
    path: expect.stringContaining('/src/bin/__tests__/controller-example.ts'),
    methods: [
      { name: 'getInfoById1', decorators: ['@RPCMethod()'] },
      { name: 'getInfoById2', decorators: ['@RPCMethod()'] },
      { name: 'getInfoById3', decorators: ['@RPCMethod()'] },
      { name: 'getUnreadMsg', decorators: ['@(OtherDecorator())', '@RPCMethod()'] }
    ]
  }, {
    name: 'Foo',
    path: expect.stringContaining('/src/bin/__tests__/controller-example.ts'),
    methods: [{ name: 'bar', decorators: ['@RPCMethod()'] }]
  }, {
    name: 'User1',
    path: expect.stringContaining('/src/bin/__tests__/controller-example1.ts'),
    methods: [
      { name: 'getInfoById1', decorators: ['@RPCMethod()'] }
    ]
  }])
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
  const iDeps = collectTypeDeps([sf.getInterfaceOrThrow('X')], prj)
  expect(iDeps.map(i => i.getName())).toEqual(['X', 'A', 'B'])

  const tDeps = collectTypeDeps([sf.getTypeAliasOrThrow('Y')], prj)
  expect(tDeps.map(t => t.getName())).toEqual(['Y', 'A', 'B'])
})

test('collect union type in returnTypeNode', () => {
  const prj = new Project({ compilerOptions: { declaration: true } })

  const sf = prj.createSourceFile('test.ts', `
    interface Inter1 { x: number }
    interface Inter2 { y: number }

    class Foo {
      public bar(): Partial<Inter1 | Inter2> {}
    }
  `)

  const m = sf.getClass('Foo')?.getMethod('bar') as MethodDeclaration
  const deps = collectTypeDeps(
    [m.getReturnTypeNodeOrThrow()],
    prj
  ).map(n => n.getText())

  expect(deps.some(d => d.includes('interface Inter1'))).toBe(true)
  expect(deps.some(d => d.includes('interface Inter2'))).toBe(true)
})

test('collect extends type', () => {
  const prj = new Project({ compilerOptions: { declaration: true } })

  const sf = prj.createSourceFile('test.ts', `
    interface Base { x: number }
    interface RS extends Base { y: number }

    class Foo {
      public async bar(): RS {}
    }
  `)

  const m = sf.getClass('Foo')?.getMethod('bar') as MethodDeclaration
  const deps = collectTypeDeps(
    [...m.getParameters(), m.getReturnTypeNodeOrThrow()],
    prj
  ).map(n => n.getText())
  expect(deps.some(d => d.includes('interface RS'))).toBe(true)
  expect(deps.some(d => d.includes('interface Base'))).toBe(true)
})
