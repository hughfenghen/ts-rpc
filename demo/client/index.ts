import { createRetmoteService } from '../../src/client'
import serverCfg from '../ts-rpc.json'

const rs = createRetmoteService(serverCfg.client)
;(async () => {
  const userInfo = await rs.User.getInfoById('')
  console.log(111, userInfo.age)
})().catch((err) => console.error(err))
