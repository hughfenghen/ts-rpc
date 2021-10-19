import { RPCMethod, RPCService } from 'ts-rpc/server'

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
