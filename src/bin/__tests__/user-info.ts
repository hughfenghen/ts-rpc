// @ts-nocheck

function TestDec (): any {}
function ClassDec (): any {}

@ClassDec
export class CUserInfo {
  @TestDec()
  name: string

  age: Date

  avatar: string
}

export interface IUserInfo {
  name: string
  age: Date
  avatar: string
}

export type TUserInfo = CUserInfo & IUserInfo
