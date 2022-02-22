import path from 'path'
import got from 'got'
import { filterService, findTSCfgPath, handleClientCmd, handleServerCmd } from '../ts-rpc'
import { filterServiceMockCode, filterServiceMockMeta } from './data/filter-service.data'

jest.mock('got')

test('handleServerCmd', async () => {
  const { metaOutDir, metaFile } = await handleServerCmd(path.resolve(__dirname, './ts-rpc-example.json'))

  expect(metaOutDir).toBe('./')
  expect(metaFile.appId).toBe('RPCTest')
})

const mockDownLoadDefStr1 = `
namespace Test1NS {
  export interface App {
    tag: 'new'
  }
}
export type Test1 = Test1NS.App;
`

const mockDownLoadDefStr2 = `
namespace Test2NS {
  export interface App {
    tag: 'new'
  }
}
export type Test2 = Test2NS.App;
`

const mockLocalDefStr = `
/* eslint-disable */

namespace Test1NS {
  export interface App {
    tag: 'old'
  }
}
export type Test1 = Test1NS.App;
`

test('handleClientCmd', async () => {
  // 避免输出
  console.log = jest.fn()
  console.warn = jest.fn()

  const spyGet = got.get as jest.Mock
  spyGet?.mockImplementation(async (arg: string) => {
    if (arg.includes('3000')) {
      return {
        body: JSON.stringify({
          appId: 'Test1',
          dts: JSON.stringify(mockDownLoadDefStr1),
          meta: []
        })
      }
    } else {
      return {
        body: JSON.stringify({
          appId: 'Test2',
          dts: JSON.stringify(mockDownLoadDefStr2),
          meta: []
        })
      }
    }
  })

  // 新建dts文件
  const fileStr1 = await handleClientCmd({
    a: '127.0.0.1:3000',
    b: '127.0.0.1:4000'
  }, '', {})

  expect(/^\/\* eslint-disable \*\//.test(fileStr1.trim())).toBeTruthy()
  expect(fileStr1.includes('export type Test1 = Test1NS.App;')).toBeTruthy()
  expect(fileStr1.includes('export type Test2 = Test2NS.App;')).toBeTruthy()
  expect(fileStr1.includes('export const Test2Meta = [];')).toBeFalsy()
  expect(fileStr1).toMatchSnapshot()

  // 合并原dts文件
  const fileStr2 = await handleClientCmd({
    a: '127.0.0.1:3000',
    b: '127.0.0.1:4000'
  }, mockLocalDefStr, { outMeta: true })

  expect(/^\/\* eslint-disable \*\//.test(fileStr2.trim())).toBeTruthy()
  expect(fileStr2.includes('export type Test1 = Test1NS.App;')).toBeTruthy()
  expect(fileStr2.includes('export type Test2 = Test2NS.App;')).toBeTruthy()
  expect(fileStr2.includes('export const Test2Meta = [];')).toBeTruthy()
  expect(fileStr2).toMatchSnapshot()
})

test('findTSCfgPath', () => {
  expect(findTSCfgPath(__dirname)).toContain('__tests__/tsconfig.json')
  expect(findTSCfgPath(path.resolve('/not-exists-path'))).toBe(null)
  expect(findTSCfgPath(path.resolve('/'))).toBe(null)
})

test('filterService', () => {
  const { code, meta } = filterService(
    filterServiceMockCode,
    filterServiceMockMeta,
    ['User1']
  )
  expect(code.includes('User1')).toBe(true)
  expect(code.includes('User2')).toBe(false)
  expect(meta.RPCDemoMeta1.length).toBe(1)
  expect(meta.RPCDemoMeta2).toBeUndefined()
})
