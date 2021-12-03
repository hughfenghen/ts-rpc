import { RPCKey } from '../common'

export { RPCKey }

interface AgentParams {
  serviceName: string
  methodName: string
  args: any[]
}

interface ServiceCfg {
  baseUrl: string
  agent?: (params: AgentParams) => Promise<unknown>
}

export function createRetmoteService<T> (cfg: ServiceCfg): T {
  const defHttpAgent = createDefAgent(cfg.baseUrl)
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
  }) as T
}

function createDefAgent (baseUrl: string) {
  return async function defHttpAgent ({ serviceName, methodName, args }: AgentParams): Promise<unknown> {
    const body = JSON.stringify({
      _ts_rpc_args_: args
    })
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      // browser env
      const url = new URL(`//${baseUrl.replace(/^\/*|\/*$/g, '')}/${serviceName}/${methodName}`, window.location.href)
      const res = await window.fetch(url.href, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body
      })
      return (await res.json())[RPCKey.Return]
    } else if (typeof global === 'object') {
      // node env
      // 避免 webpack 打包警告
      const httpStr = 'http'
      const http = await import(httpStr) as typeof import('http')
      return await new Promise((resolve, reject) => {
        const url = new URL(`http://${baseUrl.replace(/^\/*|\/*$/g, '')}/${serviceName}/${methodName}`)
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const req = http.request(url.href, options, (res) => {
          if (/^2/.test(String(res.statusCode))) {
            let rs = ''
            res.on('data', (data: string) => {
              rs += data
            })
            res.on('end', () => {
              try {
                resolve(JSON.parse(rs)[RPCKey.Return])
              } catch (err) {
                console.error('[ts-brpc] Cannot parse response to json')
                reject(err)
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
}
