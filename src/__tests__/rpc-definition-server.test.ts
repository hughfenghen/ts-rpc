import { MethodDeclaration, Project } from 'ts-morph'
import { collectMethodTypeDeps, collectTypeDeps } from '../rpc-definition-server'

// test('start server', async () => {
//   const server = await startRPCDefinitionServer(path.resolve(__dirname, '*.ts'))
//   expect(server).toBeInstanceOf(Function)
//   expect(server()).toBe('')
// })

test('collectMethodTypeDeps', () => {
  const prj = new Project({ compilerOptions: { declaration: true } })
  const sf = prj.createSourceFile('test.ts', `
    interface A {}
    type B {}
    interface Z {}

    class Test {
      foo (a: A, b: B, c: string): Z {}
      // foo () {}
    }
  `)

  // console.log(111, sf.getClass('Test'))
  const deps = collectMethodTypeDeps(
    sf.getClass('Test')?.getMethod('foo') as MethodDeclaration,
    [sf]
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
