import { RPCMethod, RPCService } from '../../server'
import { CUserInfo } from '@/user-info'

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
