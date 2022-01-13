import { RPCMethod, RPCService } from '../../server'
// @ts-expect-error
import { CUserInfo } from '@/user-info'

interface Other {
  o: string
}

/**
 * service doc
 * 验证公共依赖 CUserInfo
 */
@RPCService()
export class User1 {
  /**
   * method doc
   */
  @RPCMethod()
  getInfoById1 (id: string): CUserInfo {
    return {} as any
  }
}
