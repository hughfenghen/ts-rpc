import { RPCMethod, RPCService } from '../../server'
import { CUserInfo, Gender1, IUserInfo, TUserInfo } from '@/user-info'

interface Other {
  o: string
}

function OtherDecorator (): any {}

function ParamsDecorator (): any {}

/**
 * 与其他文件中的变量命名冲突，只保留一份，扫描时提供警告
 */
interface IDuplicate {
  nothing: string
}

/**
 * service doc
 */
@RPCService()
export class User {
  /**
   * method doc
   */
  @RPCMethod()
  getInfoById1 (id: string = '111'): CUserInfo & IDuplicate {
    return {} as any
  }

  @RPCMethod()
  getInfoById2 (id: string): IUserInfo & { gender: Gender1 } {
    return {} as any
  }

  @RPCMethod()
  getInfoById3 (@ParamsDecorator() id: string): TUserInfo {
    return {} as any
  }

  @(OtherDecorator())
  @RPCMethod()
  async getUnreadMsg (id: string): Promise<string[]> {
    return []
  }

  @(OtherDecorator())
  other (): Other {
    return {} as any
  }
}

// 新版 typescript-json-schema 遇到 return void 会报错
// @RPCService()
// export class Foo {
//   @RPCMethod()
//   async bar (): Promise<void> {}
// }
