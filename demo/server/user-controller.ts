import { RPCMethod, RPCService } from 'ts-brpc/server'

interface UserInfo {
  name: string
  age: number
  avatar: string
}

interface Other {
  o: string
}

function Post (): any {
  return () => {}
}

/**
 * service doc
 */
@RPCService()
export class User {
  /**
   * method doc
   */
  @Post()
  @RPCMethod()
  getInfoById (id: string): UserInfo {
    return { name: '22', age: 18, avatar: '' }
  }

  @RPCMethod()
  getUnreadMsg (id: string): string[] {
    return []
  }

  other (): Other {
    return {} as any
  }
}
