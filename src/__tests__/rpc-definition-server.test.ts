import path from 'path'
import { collectRPCServiceAST, startRPCDefinitionServer } from '../rpc-definition-server'

test('start server', async () => {
  const server = await startRPCDefinitionServer(path.resolve(__dirname, '*.ts'))
  expect(server).toBeInstanceOf(Function)
  expect(server()).toBe('')
})

test('collectRPCServiceAST', async () => {
  await collectRPCServiceAST(path.resolve(__dirname, 'user-controller.ts'))
})
