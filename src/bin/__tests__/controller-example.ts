import { RPCMethod, RPCService } from '../../server'

interface UserInfo {
  name: string
  age: number
  avatar: string
}

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
