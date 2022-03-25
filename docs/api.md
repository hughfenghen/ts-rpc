# API 

## 目录
- [ts-brpc.json](#ts-brpc.json)  
- [cli](#cli)  
- [ts-brpc/server](#ts-brpc/server)  
- [ts-brpc/client](#ts-brpc/client)  

## ts-brpc.json
配置文件提供给 cli，用于服务端扫描、客户端同步、客户端自动生成Mock数据等。  
建议放在 src 目录下。  

**名词**  
- 声明文件：名字为`rpc-definition.ts`的文件，由 cli 生成，内容为服务端扫描得到的类型信息、meta 数据。  

```json5
{
  // 建议大驼峰命名，不能出现非变量命名符号
  "appId": "App",
  // 如果服务端、客户端不在同一个项目中，可以拆开
  // 客户端需要的配置
  "client": {
    // 从以下地址中去同步服务端的扫描结果，可以对应多个环境或多个 RPC 服务端，同步结果会自动合并至声明文件
    "apps": {
      "app-local": "127.0.0.1:3000"
    },
    // 声明文件对应path，生成的声明文件需要提交到 git
    "genRPCDefintionTarget": "./",
    // 只保留指定 Service，多个 client 对应一个 Server 的场景，可以避免声明文件过多冗余内容
    "includeServices": ["<保留的 Service 名称>"],
    // 支持 零成本自动生成符合类型的 mock 数据，配置规则生成美化数据，手工编写特定数据
    // 美化数据 参考：https://github.com/hughfenghen/ts-rpc/blob/main/demo/client/__rpc-mocks__/mock-rules.js
    // 手工编写 参考：https://github.com/hughfenghen/ts-rpc/blob/main/demo/client/__rpc-mocks__/user.js
    "mock": {
      // mockserver 端口
      "port": 3030,
      // mock 文件匹配规则
      "fileMatch": [ "client/__rpc-mocks__/*.js" ]
    }
  },
  // 服务端需要的配置
  "server": {
    // RPCService 所在文件
    "scanDir": ["server/*.ts"],
    // meta 文件对应 path，存储扫描生成的信息
    "metaOutDir": "./"
  }
}
```

## cli
```sh
ts-brpc server -c <ts-brpc.json path> --metaOutDir [扫描结果输出目录]
-c --config, <必填>, ts-brpc.json路径
--metaOutDir, [可选], 扫描结果输出目录，默认值 ts-brpc.json 所在目录，也可在 ts-brpc.json 中的 server.metaOutDir 指定
注：build 项目时可将扫描结果输出到 dist 目录，使得启动 Web 服务（如 bindKoa）时可被读取到

ts-brpc client -c <ts-brpc.json path> -ms
-c --config, <必填>, ts-brpc.json路径
-ms, --mock-server, [可选] 是否启动 Mock Server
启动 mockserver 后，可通过URL访问，如：127.0.0.1:3030/User/getInfoById
```

## ts-brpc/server
```ts
import { RPCService, RPCMethod, bindKoa, bindMidway, logger } from 'ts-brpc/server'
```

- RPCService  
Decorator，标注 class，用于扫描时识别  
```ts
@RPCService()
class User {
  //  类型Koa 的 ctx， 自动注入，method 中通过 this.ctx 访问
  ctx
}
```

- RPCMethod  
Decorator，标注 method，用于扫描时识别  
```ts
@RPCService()
class User {
  @RPCMethod()
  getInfoById() {}
}
```
  
- bindKoa  
关联到 Koa app，使 http 请求能转发到 RPCService、RPCMehtod 标注的接口处理  
```ts
bindKoa({
  // app = new Koa()
  app,
  // 扫描输出文件的路径
  rpcMetaPath: path.resolve(__dirname, '../_rpc_gen_meta_.json'),
  // 即 ctx.path 中的固定前缀，如 /xxx/User/getInfoById 的 prefixPath 就是 /xxx，没有固定前缀就填 '/'
  prefixPath: '/'
})
```

- bindMidway  
```ts
import { Framework } from '@midwayjs/koa'
// 暂未对结过其他类型的 Framework
export class WebFramework extends Framework {
  async applicationInitialize(options: IMidwayBootstrapOptions) {
    bindMidway({
      app: this.app,
      // 扫描输出文件的路径
      rpcMetaPath: path.resolve(__dirname, '../_rpc_gen_meta_.json'),
      // 即 ctx.path 中的固定前缀，如 /xxx/User/getInfoById 的 prefixPath 就是 /xxx，没有固定前缀就填 '/'
      prefixPath: '/'
    }).catch((err) => {
      console.error(err)
    })
  }
}
```
  
- logger  
```ts
// logger.watch 可以监听日志消息
logger.watch((logItem) => {
  // logItem: {log: string, lv: 0 | 1| 2| 3 }
})
```

## ts-brpc/client
```ts
import { createRemoteService } from 'ts-brpc/client'
```

- createRemoteService  
```ts
// ts-brpc 扫描服务端代码生成的 rpc-definition.ts， 不用关心 APP、APPMeta 的结构，由 rpc-cli 维护
import { App, AppMeta } from './rpc-definition'

const rpc = createRemoteService<App>({
  // 必填，包括远端服务的host、前缀
  baseUrl: '<host>/<prefix>',
  // 可选，自定义实现 http 请求的发送逻辑
  // 参考： https://github.com/hughfenghen/ts-rpc/blob/main/demo/client/index.ts, 根据 meta 决定 http 是 get 还是 post 
  agent: (params: AgentParams) => { /**/ },
  // 可选，
  meta: AppMeta
})
```
