// @ts-nocheck

function TestDec (): any {}
function ClassDec (): any {}

/**
 * 注释：性别
 */
enum Gender1 {
  /**
   * 枚举注释
   */
  Male = 'male',
  Female = 'female'
}

// 一个神奇的边缘 case 写法
type Gender = Gender1.Male | Gender1.Female

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
