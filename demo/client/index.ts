import { createRetmoteService } from 'ts-brpc/client'
import RPCDemo from 'ts-brpc/client/app/rpc-demo'
import rpcCfg from '../ts-rpc.json'

const rs = createRetmoteService<RPCDemo>(rpcCfg.client)

document.getElementById('send')?.addEventListener('click', () => {
  ; (async () => {
    const userInfo = await rs.User.getInfoById('111')
    ;(document.getElementById('result') as HTMLDivElement).textContent = JSON.stringify(userInfo, null, 2)
  })().catch((err) => console.error(err))
})
