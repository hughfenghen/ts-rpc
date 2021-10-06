import { RPCMethod, RPCService } from '../server'

interface UserInfo {
  name: string
  age: number
  avatar: string
}

/**
 * class doc
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
}
