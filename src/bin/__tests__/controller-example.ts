import { RPCMethod, RPCService } from '../../server'
import { CUserInfo, IUserInfo, TUserInfo } from './user-info'

interface Other {
  o: string
}

function OtherDecorator (): any {}

/**
 * service doc
 */
@RPCService()
export class User {
  /**
   * method doc
   */
  @RPCMethod()
  getInfoById1 (id: string): CUserInfo {
    return {} as any
  }

  @RPCMethod()
  getInfoById2 (id: string): IUserInfo {
    return {} as any
  }

  @RPCMethod()
  getInfoById3 (id: string): TUserInfo {
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
