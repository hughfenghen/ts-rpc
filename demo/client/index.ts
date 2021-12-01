import { createRetmoteService } from 'ts-brpc/client'
import rpcCfg from '../ts-rpc.json'
import { RPCDemo } from './rpc-definition'

const rs = createRetmoteService<RPCDemo>({
  baseUrl: rpcCfg.client.apps.a
})

document.getElementById('send')?.addEventListener('click', () => {
  ; (async () => {
    const userInfo = await rs.User.getInfoById('111')
    ;(document.getElementById('result') as HTMLDivElement).textContent = JSON.stringify(userInfo, null, 2)
  })().catch((err) => console.error(err))
})
