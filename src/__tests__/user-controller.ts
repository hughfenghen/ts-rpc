import { RPCMethod, RPCService } from '../server'

interface UserInfo {
  name: string
  age: number
  avatar: string
}

@RPCService()
export class User {
  @RPCMethod()
  getInfoById (id: string): UserInfo {
    return {} as any
  }
}
