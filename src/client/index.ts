import { ServiceCollection } from './__service-collection__'

interface ServiceCfg {
  baseUrl: string
  agent?: (req: Request) => Promise<Response>
}

export function createRetmoteService (cfg: ServiceCfg): ServiceCollection {
  async function defAgent (req: Request): Promise<Response> {
    return await fetch(req)
  }

  function createReq (sName: string, sMethod: string, args: any[]): Request {
    const url = new URL(`//${cfg.baseUrl.replace('//', '')}/${sName}/${sMethod}`, window.location.href)

    return new Request(url.href, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        _ts_rpc_args_: args
      })
    })
  }

  return new Proxy({}, {
    get (t, sName) {
      return new Proxy({}, {
        get (t, sMethod) {
          return async (...args: unknown[]) => {
            return await (cfg.agent ?? defAgent)(
              createReq(sName as string, sMethod as string, args)
            ).then(async (res) => await res.json())
          }
        }
      })
    }
  })
}
