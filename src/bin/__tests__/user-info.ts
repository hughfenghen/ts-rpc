// @ts-nocheck

function TestDec (): any {}
function ClassDec (): any {}

/**
 * 注释：性别
 */
enum Gender {
  /**
   * 枚举注释
   */
  Male = 'male',
  Female = 'female'
}

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
  gender: Gender
}

export type TUserInfo = CUserInfo & IUserInfo
