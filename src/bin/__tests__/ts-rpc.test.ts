import fs from 'fs'
import path from 'path'
import { filterService, findTSCfgPath, handleClientCmd, handleServerCmd } from '../ts-rpc'
import { filterServiceMockCode, filterServiceMockMeta } from './data/filter-service.data'

console.warn = jest.fn()

test('handleServerCmd', async () => {
  const { metaOutDir, metaFile } = await handleServerCmd(path.resolve(__dirname, './ts-rpc-example.json'))

  expect(metaOutDir).toBe('./')
  expect(metaFile.appId).toBe('RPCTest')
})

const mockDownLoadDefStr1 = `
namespace Test1NS {
  export interface App {
    S1: S1
  }
  interface S1 {}
}
export type Test1 = Test1NS.App;
`

const mockDownLoadDefStr2 = `
namespace Test2NS {
  export interface App {
    S2: S2
  }
  interface S2 {}
}
export type Test2 = Test2NS.App;
`

const mockLocalDefStr = `
/* eslint-disable */

namespace Test1NS {
  export interface App {
    S: S
  }
  interface S {}
}
export type Test1 = Test1NS.App;
`

describe('handleClientCmd', () => {
  test('new definition file', async () => {
    // 新建dts文件
    const { code } = await handleClientCmd({
      Test1: {
        dts: mockDownLoadDefStr1,
        meta: []
      },
      Test2: {
        dts: mockDownLoadDefStr2,
        meta: []
      }
    }, '', {})

    expect(/^\/\* eslint-disable \*\//.test(code.trim())).toBe(true)
    expect(code.includes('export type Test1 = Test1NS.App;')).toBe(true)
    expect(code.includes('export type Test2 = Test2NS.App;')).toBe(true)
    expect(code).toMatchSnapshot()
  })

  test('concat definition file', async () => {
    // 合并原dts文件
    const { code } = await handleClientCmd({
      Test1: {
        dts: mockDownLoadDefStr1,
        meta: []
      },
      Test2: {
        dts: mockDownLoadDefStr2,
        meta: []
      }
    }, mockLocalDefStr, {})

    expect(code.trim().startsWith('/* eslint-disable */')).toBe(true)
    expect(code.includes('export type Test1 = Test1NS.App;')).toBe(true)
    expect(code.includes('export type Test2 = Test2NS.App;')).toBe(true)
    expect(code.includes('export const Test2Meta = [];')).toBe(true)
    expect(code).toMatchSnapshot()
  })

  test('includeServices config', async () => {
    const { code } = await handleClientCmd({
      Test1: {
        dts: mockDownLoadDefStr1,
        meta: [{ name: 'S1', path: '', methods: [] }]
      },
      Test2: {
        dts: mockDownLoadDefStr2,
        meta: []
      }
    }, mockLocalDefStr, { includeServices: ['S1'] })

    expect(code.trim().startsWith('/* eslint-disable */')).toBe(true)
    expect(code.includes('interface S1')).toBe(true)
    expect(code.includes('export type Test1 = Test1NS.App;')).toBe(true)
    expect(code.includes('export const Test1Meta = [')).toBe(true)
    expect(code.includes('export type Test2 = Test2NS.App;')).toBe(false)
  })
})

test('findTSCfgPath', () => {
  expect(findTSCfgPath(__dirname)).toContain('__tests__/tsconfig.json')
  expect(findTSCfgPath(path.resolve('/not-exists-path'))).toBe(null)
  expect(findTSCfgPath(path.resolve('/'))).toBe(null)
})

describe('filterService', () => {
  test('simple', () => {
    const { code, meta } = filterService(
      filterServiceMockCode,
      filterServiceMockMeta,
      ['User1', 'User2']
    )

    expect(code.includes('User1')).toBe(true)
    expect(code.match(/export interface UserInfo/g)?.length).toBe(1)
    expect(code.includes('User3')).toBe(false)
    expect(meta.RPCDemoMeta1.length).toBe(2)
    expect(meta.RPCDemoMeta2).toBeUndefined()
  })

  test('complex', () => {
    const { code, meta } = filterService(
      String(fs.readFileSync(path.resolve(__dirname, './data/complex-definition-code.data.ts'))),
      filterServiceMockMeta,
      ['AwardService']
    )

    expect(code.includes('interface AwardService')).toBe(true)
    expect(code.includes('interface IServiceData')).toBe(true)
    expect(code.includes('type IGetRewardConfigDataFormated')).toBe(true)
    expect(code.includes('interface BlsSpring2022Controller')).toBe(false)
    expect(meta).toEqual({})
  })
})
