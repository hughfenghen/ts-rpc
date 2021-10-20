import path from 'path'
import { handleServerCmd } from '../ts-rpc'

test('handleServerCmd', async () => {
  await handleServerCmd(path.resolve(__dirname, './ts-rpc-example.json'))
  // expect(fs.writeFile).toBeCalled()
})
