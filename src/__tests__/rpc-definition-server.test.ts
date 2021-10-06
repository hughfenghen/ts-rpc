import { MethodDeclaration, Project } from 'ts-morph'
import { collectMthodTypeDeps } from '../rpc-definition-server'

// test('start server', async () => {
//   const server = await startRPCDefinitionServer(path.resolve(__dirname, '*.ts'))
//   expect(server).toBeInstanceOf(Function)
//   expect(server()).toBe('')
// })

test('collectMthodTypeDeps', () => {
  const prj = new Project({ compilerOptions: { declaration: true } })
  const sf = prj.createSourceFile('test.ts', `
    interface A { a1: B }
    interface B {}
    interface Z {}

    class Test {
      foo (a: A, b: B, c: string): Z {}
      // foo () {}
    }
  `)

  // console.log(111, sf.getClass('Test'))
  const deps = collectMthodTypeDeps(
    sf.getClass('Test')?.getMethod('foo') as MethodDeclaration,
    [sf]
  )
  expect(deps.map(d => d.getName())).toEqual(['A', 'B', 'Z'])
})
