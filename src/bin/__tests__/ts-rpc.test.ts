import path from 'path'
import { handleServerCmd } from '../ts-rpc'

test('handleServerCmd', async () => {
  const { metaOutDir, metaFile } = await handleServerCmd(path.resolve(__dirname, './ts-rpc-example.json'))

  expect(metaOutDir).toBe('./')
  expect(metaFile.appId).toBe('rpc-test')
})
