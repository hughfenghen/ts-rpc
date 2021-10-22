import { createRetmoteService } from 'ts-rpc/client'
import serverCfg from '../ts-rpc.json'

const rs = createRetmoteService(serverCfg.client)

document.getElementById('send')?.addEventListener('click', () => {
  ; (async () => {
    const userInfo = await rs.User.getInfoById('111')
    console.log('userInfo:', userInfo)
  })().catch((err) => console.error(err))
})
