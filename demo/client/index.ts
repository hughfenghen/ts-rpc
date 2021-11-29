import { createRetmoteService } from 'ts-brpc/client'
import rpcCfg from '../ts-rpc.json'
import App from '../../client/app/rpc-demo'

const rs = createRetmoteService<App>(rpcCfg.client)

document.getElementById('send')?.addEventListener('click', () => {
  ; (async () => {
    const userInfo = await rs.User.getInfoById('111')
    ;(document.getElementById('result') as HTMLDivElement).textContent = JSON.stringify(userInfo, null, 2)
  })().catch((err) => console.error(err))
})
