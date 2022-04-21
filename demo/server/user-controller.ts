import { RPCMethod, RPCService } from 'ts-brpc/server'

interface UserInfo {
  id: string
  name: string
  age: number
  avatar: string
}

interface Other {
  o: string
}

// 仅用于标记 Method，传递给 client
function Post () {
  return (
    target: Object,
    key: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => any>
  ) => {}
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
    return { id, name: '22', age: 18, avatar: '' }
  }

  @RPCMethod()
  getUnreadMsg (id: string): { code: number, data: string[] } {
    return {
      code: 0,
      data: ['']
    }
  }

  other (): Other {
    return {} as any
  }
}

@RPCService()
export class Foo {
  @RPCMethod()
  foo (id: string): UserInfo {
    return { id, name: '22', age: 18, avatar: '' }
  }
}
