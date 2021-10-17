import { RPCMethod, RPCService } from '..'

interface UserInfo {
  name: string
  age: number
  avatar: string
}

interface Other {
  o: string
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
  getInfoById (id: string): UserInfo {
    return {} as any
  }

  @RPCMethod()
  getUnreadMsg (id: string): string[] {
    return []
  }

  other (): Other {
    return {} as any
  }
}

@RPCService()
export class Foo {
  @RPCMethod()
  bar (): void {}
}
