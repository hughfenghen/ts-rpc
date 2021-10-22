import { createRetmoteService } from '../../src/client'
import serverCfg from '../ts-rpc.json'

const rs = createRetmoteService(serverCfg.client)

document.getElementById('send')?.addEventListener('click', () => {
  ; (async () => {
    const userInfo = await rs.User.getInfoById('111')
    console.log(111, userInfo.age)
  })().catch((err) => console.error(err))
})
