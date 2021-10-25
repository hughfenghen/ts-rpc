import { createRetmoteService } from '@hughfenghen/ts-rpc/client'
import serverCfg from '../ts-rpc.json'

const rs = createRetmoteService(serverCfg.client)

document.getElementById('send')?.addEventListener('click', () => {
  ; (async () => {
    const userInfo = await rs.User.getInfoById('111')
    ;(document.getElementById('result') as HTMLDivElement).textContent = JSON.stringify(userInfo, null, 2)
  })().catch((err) => console.error(err))
})
