import path from 'path'
import { Project } from 'ts-morph'
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
  const iDeps = collectTypeDeps(sf.getInterfaceOrThrow('X'), prj)
  expect(iDeps.map(i => i.getName())).toEqual(['X', 'A', 'B'])

  const tDeps = collectTypeDeps(sf.getTypeAliasOrThrow('Y'), prj)
  expect(tDeps.map(t => t.getName())).toEqual(['Y', 'A', 'B'])
})
