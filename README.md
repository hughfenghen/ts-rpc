# ts-brpc

`ts-brpc`支持以 RPC 风格调用 TypeScript 编写的服务端接口，让开发者专注业务实现。  

## 特性
- `ts-brpc`让客户端以 RPC 风格调用接口，函数调用是程序最自然的通信方式，免去手动构造 HTTP 请求。  
- `ts-brpc`可以扫描服务端 TS 代码中的类型信息，可在编码时为客户端提供类型校验、代码补全、接口注释；代码即 API 文档。  
- `ts-brpc`借由扫描获得的类型信息，零成本支持自动生成接口 Mock 数据的能力。  
- `ts-brpc`由 CLI + SDK 组成，运行时（SDK）非常轻量，可与 Koa、Midway.js 快速集成。  

## 示例展示

### Server
```ts
import { RPCMethod, RPCService } from 'ts-brpc/server'

interface UserInfo {
  id: string
  name: string
  age: number
}

@RPCService()
export class User {

  @RPCMethod()
  getInfoById (id: string): UserInfo {
    return { id, name: '22', age: 18 }
  }

  @RPCMethod()
  getUnreadMsg (id: string): Promise<string[]> {
    // 模拟异步调用
    return Promise.resolve(['msg1', 'msg2'])
  }
}
```

### Client
```ts
import { createRemoteService } from 'ts-brpc/client'
// ts-brpc 扫描服务端代码生成的 rpc-definition.ts
import { App } from './rpc-definition'

const rpc = createRemoteService<App>({
  baseUrl: '<web app base url>'
})

await rpc.User.getInfoById('22') // => { id: '22', name: '22', age: 18 }
```


### 运行 demo
1. `git clone git@github.com:hughfenghen/ts-rpc.git`  
2. `yarn && yarn build`
3. `cd demo && yarn`  
4. `yarn server` 然后新开 shell 窗口 `yarn client`  

## 文档
- [接入指南](./docs/guide.md)
- [API](./docs/api.md)
- [工作原理](./docs/design.md)
