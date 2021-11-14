// @ts-nocheck

function TestDec (): any {}
function ClassDec (): any {}

@ClassDec
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
