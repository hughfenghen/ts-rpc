
### 配置文件 ts-brpc.json
```json5
{
  // 建议大驼峰命名，不能出现非变量命名符号
  "appId": "RPCDemo",
  // 客户端需要的配置
  "client": {
    "apps": {
      // key用来表示 app + 对应环境；value 为远端服务baseURL
      "demoLocal": "127.0.0.1:7002"
    },
    // 声明文件对应path，生成的声明文件需要提交到 git
    "genRPCDefintionTarget": "./",
    // 只保留指定 Service，避免声明文件过多冗余内容
    "includeServices": ["<保留的 Service 名称>"]
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

### 服务端
```ts
// 运行 server 服务之前执行`ts-brpc`命令
// scripts: yarn ts-brpc server -c ts-brpc.json && yarn dev

import Koa from 'koa'
import path from 'path'
import bodyParser from 'koa-bodyparser'
import { bindKoa, RPCService, RPCMethod, logger } from 'ts-brpc/server'

const app = new Koa()
app.use(bodyParser())

bindKoa({  // 或者 bindMidway
  app,  // koa app
  rpcMetaPath: path.resolve(__dirname, '../_rpc_gen_meta_.json'),
  prefixPath: '/'
}).catch((err) => {
  console.error(err)
})

@RPCService()
class User {

  // bindKoa 自动注入 ctx
  ctx

  // midway 通过框架注解手动注入
  // @Inject()
  // resp: IRespHandle

  @RPCMethod()
  getInfoById(id: string): { name: string, age: number, avatar: string } {
    // 从上游获取数据
    return {
      name: '22',
      age: 18,
      avatar: '<image url>'
    }
  }
}

// logger.watch 可以监听日志消息
logger.watch((logItem: {log: string, lv: LogLevel}) => {
  // 处理日志
})
```

### 客户端
```ts
// 运行 client 服务之前执行`ts-brpc`命令
// scripts: yarn ts-brpc client -c ts-brpc.json && yarn dev

import { createRemoteService, RPCKey } from 'ts-brpc/client'
import { client as rpcCientCfg } from '../ts-rpc.json'
import { RPCDemo, RPCDemoMeta } from './rpc-definition'

const rpc = createRemoteService<RPCDemo>({
  baseUrl: cfg.apps.demoLocal,
  // meta可选，给 agent 添加 server 端的 meta 信息
  meta: RPCDemoMeta,
  // 可选，用于拦截处理请求
  // agent: ({ serviceName, methodName, args, meta }) => {
  //   // meta.decorators 可以获取信息，判断是否使用 post 请求
  //   return axios.get(`//${cfg.apps.demoLocal}/${serviceName}/${methodName}`, {
  //     data: {
  //       [RPCKey.Args]: args
  //     }
  //   }).then((res) => {
  //     return res[RPCKey.Return]      
  //   })
  // }
})

const userInfo = await rpc.User.getInfoById('<user id>')
console.log(userInfo) // { name: '22', age: 18, avatar: '<imgage url>' }
```