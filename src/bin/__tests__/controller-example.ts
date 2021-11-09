import { RPCMethod, RPCService } from '../../server'
import { UserInfo } from './user-info'

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
  getInfoById (id: string): UserInfo {
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
