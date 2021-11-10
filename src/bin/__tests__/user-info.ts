// @ts-nocheck

function TestDec (): any {}

export class CUserInfo {
  @TestDec()
  name: string

  age: number

  avatar: string
}

export interface IUserInfo {
  name: string
  age: number
  avatar: string
}

export type TUserInfo = CUserInfo & IUserInfo
