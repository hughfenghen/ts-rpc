# ts-brpc 快速接入

**目前支持 Koa、Midway.js**

## 前言
开始之前先了解 ts-brpc 客户端-服务端 大致通信原理，有助于理解后续步骤。  
先看看项目配置完成后的普通业务代码  
```ts
// 服务端
@RPCService()
export class User {
  @RPCMethod()
  getInfoById (id: string): UserInfo {
    return { id, name: '22', age: 18 }
  }
}
// 客户端
await rpc.User.getInfoById('22') // => { id: '22', name: '22', age: 18 }
```
客户端看起来是在调用本地函数（User.getInfoById），实际上底层会被封装成 HTTP 请求发送给服务端。  
所以服务端需要监听端口，启动一个Web服务，客户端需要知道URL（<host>/<prefix>/User/getInfoById）  
参考[工作原理](./design.md)

## 接入步骤
### 服务端（Server）
1. 安装依赖
`yarn add ts-brpc` or `npm i ts-brpc`

2. 在服务端项目 src 目录下创建 `ts-brpc.json`
```json5
{
  // 根据项目特色命名，若一个 client 对应多个 Server，Server 的 appId 不能重复
  "appId": "App",
  "server": {
    // RPC 服务所在目录 (相对配置文件)
    "scanDir": ["api/*.ts"]
  }
}
```
参考[ts-brpc.json说明](./api.md)

3. 创建 RPC Service 代码
新建文件如 `src/api/user.ts`
```ts
import { RPCMethod, RPCService } from 'ts-brpc/server'

interface UserInfo {
  id: string
  name: string
  age: number
  avatar: string
}

@RPCService()
export class User {

  @RPCMethod()
  getInfoById (id: string): UserInfo {
    return { id, name: '22', age: 18 }
  }

  @RPCMethod()
  getUnreadMsg (id: string): Promise<string[]> {
    return Promise.resolve(['msg1', 'msg2'])
  }
}
```
参考[server API](./api.md)  
*如果项目采用 Midway.js 框架，给已有 Api（Controller）中的 class 添加 RPCService、RPCMethod 即可*  

4. 在 package.json 添加 scripts，扫描 RPC Service
```json
{
  "scripts": {
    "rpc-server": "yarn ts-brpc server -c ts-brpc.json",
    "dev": "yarn rpc-server && <原项目启动命令>"
  }
}
```
`rpc-scan`会输出扫描结果文件（_rpc_gen_meta_.json）到ts-brpc.json相同的目录。  
*输出目录可配置，参考[cli](./api.md)*

5. 对接 Koa、Midway.js
**Koa**
```ts
import Koa from 'koa'
import path from 'path'
import { bindKoa } from 'ts-brpc/server'

const app = new Koa()

bindKoa({
  app,
  // 扫描输出文件路径
  rpcMetaPath: path.resolve(__dirname, '../_rpc_gen_meta_.json'),
  // 即 ctx.path 中的固定前缀，如 /xxx/User/getInfoById 的 prefixPath 就是 /xxx，没有固定前缀就填 '/'
  prefixPath: '/'
}).catch((err) => {
  console.error(err)
})

app.listen(3000)
```
**Midway.js**
```ts
import Koa from 'koa'
import path from 'path'
import { Framework } from '@midwayjs/koa'
import { bindMidway } from 'ts-brpc/server'

// 暂未对结过其他类型的 Framework
export class WebFramework extends Framework {
  async applicationInitialize(options: IMidwayBootstrapOptions) {
    bindMidway({
      app: this.app,
      rpcMetaPath: path.resolve(__dirname, '../_rpc_gen_meta_.json'),
      prefixPath: '/'
    }).catch((err) => {
      console.error(err)
    })
  }
}
```

6. `.gitignore` 中添加 `_rpc_gen_meta_.json` 
git忽略扫描生成的文件，在启动项目前、构建项目前执行 `rpc-scan` 命令重新生成，避免与实际接口内容不一致。  

### 客户端（Client）
1. 安装依赖（如果 Server 跟 Client 在同一项目中，可略过）
`yarn add ts-brpc` or `npm i ts-brpc`

2. 在客户端端项目 src 目录下创建 `ts-brpc.json`
```json5
{
  "client": {
    // 从以下地址中去同步服务端的扫描结果，可以对应多个环境或多个 RPC 服务端，同步结果会自动合并
    "apps": {
      "local-app1": "localhost:3000",
      "test-app2": "localhost:8080/prefix"
    },
    // 从服务端同步的文件存放地址
    "genRPCDefintionTarget": "./client"
  }
}
```
参考[ts-brpc.json说明](./api.md)

3. 在 package.json 添加 scripts，向服务端同步扫描结果
```json
{
  "scripts": {
    "rpc-client": "yarn ts-brpc client -c ts-brpc.json",
    "dev": "yarn rpc-client && <原项目启动命令>"
  }
}
```
`rpc-client`命令会根据`ts-brpc.json`中配置（client.apps）同步服务端扫描结果，  
生成一个`rpc-definition.ts`文件到 client.genRPCDefintionTarget 目录

4. 添加客户端代码
```ts
import { createRemoteService } from 'ts-brpc/client'
// ts-brpc 扫描服务端代码生成的 rpc-definition.ts
import { App } from './rpc-definition'

const rpc = createRemoteService<App>({
  // 可考虑复用 ts-brpc.json 中的 client.app 配置
  baseUrl: '<web app base url>'
})

await rpc.User.getInfoById('22') // => { id: '22', name: '22', age: 18 }
```
若要自定义 http 请求，参考[client API](./api.md)

---

完成以上步骤即接入完成，先运行服务端、再运行客户端，即可在客户端远程调用服务端接口。  