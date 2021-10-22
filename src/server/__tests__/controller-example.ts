import { RPCMethod, RPCService } from '../../server'

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
    console.log('----- getInfoById, id:', id)
    return {} as any
  }

  @RPCMethod()
  async getUnreadMsg (id: string): Promise<string[]> {
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