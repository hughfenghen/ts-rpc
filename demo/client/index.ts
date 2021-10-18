import { createRetmoteService } from 'ts-rpc/client'
import serverCfg from './ts-rpc.json'

const rs = createRetmoteService(serverCfg)
;(async () => {
  const userInfo = await rs.User.getInfoById('')
  console.log(111, userInfo.age)
})()