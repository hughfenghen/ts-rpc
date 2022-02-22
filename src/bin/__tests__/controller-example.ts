import { RPCMethod, RPCService } from '../../server'
import { CUserInfo, IUserInfo, TUserInfo } from '@/user-info'

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
  getInfoById2 (id: string): IUserInfo {
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

@RPCService()
export class Foo {
  @RPCMethod()
  bar (): void {}
}
