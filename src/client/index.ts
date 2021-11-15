import { ServiceCollection } from './__service-collection__'

interface AgentParams {
  serviceName: string
  methodName: string
  args: any[]
}

interface ServiceCfg {
  baseUrl: string
  agent?: (params: AgentParams) => Promise<unknown>
}

export function createRetmoteService (cfg: ServiceCfg): ServiceCollection {
  async function defHttpAgent ({ serviceName, methodName, args }: AgentParams): Promise<unknown> {
    const body = JSON.stringify({
      _ts_rpc_args_: args
    })
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      // browser env
      const url = new URL(`//${cfg.baseUrl.replace(/^\/*|\/*$/g, '')}/${serviceName}/${methodName}`, window.location.href)
      const res = await window.fetch(url.href, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body
      })
      return await res.json()
    } else if (typeof global === 'object') {
      // node env
      const http = await import('http')
      return await new Promise((resolve, reject) => {
        const url = new URL(`http://${cfg.baseUrl.replace(/^\/*|\/*$/g, '')}/${serviceName}/${methodName}`)
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const req = http.request(url.href, options, res => {
          if (/^2/.test(String(res.statusCode))) {
            res.on('data', (data) => {
              try {
                resolve(JSON.parse(String(data)))
              } catch (err) {
                console.warn('Cannot parse response to json')
                resolve(data)
              }
            })
          } else {
            reject(res)
          }
        })

        req.on('error', reject)

        req.write(body)
        req.end()
      })
    }
  }

  return new Proxy({}, {
    get (t, serviceName: string) {
      return new Proxy({}, {
        get (t, methodName: string) {
          return async (...args: unknown[]) => {
            return await (cfg.agent ?? defHttpAgent)(
              { serviceName, methodName, args }
            )
          }
        }
      })
    }
  })
}
