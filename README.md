# ts-brpc

`ts-brpc`尝试将 ts+node 场景下 web 服务的 restful 替换为 RPC 风格，专注逻辑隐藏 http 请求细节。  
`ts-brpc`可以扫描 ts 代码中的类型信息，免去 API 文档维护成本，代码即 API 文档；并且可在编码时提供类型校验。  

## 使用方法

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
    "genRPCDefintionTarget": "./"
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

import { bindKoa, RPCService, RPCMethod } from 'ts-brpc/server'

bindKoa(User) // 或者 bindMidway

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
```

### 客户端
```ts
// 运行 client 服务之前执行`ts-brpc`命令
// scripts: yarn ts-brpc client -c ts-brpc.json && yarn dev

import { createRetmoteService, RPCKey } from 'ts-brpc/client'
import { client as rpcCientCfg } from '../ts-rpc.json'
import { RPCDemo } from './rpc-definition'

const rs = createRetmoteService<RPCDemo>({
  baseUrl: cfg.apps.demoLocal,
  // 可选，用于拦截处理请求
  // agent: ({ serviceName, methodName, args }) => {
  //   return axios.post(`//${cfg.apps.demoLocal}/${serviceName}/${methodName}`, {
  //     data: {
  //       [RPCKey.Args]: args
  //     }
  //   }).then((res) => {
  //     return res[RPCKey.Return]      
  //   })
  // }
})

const userInfo = await rs.User.getInfoById('<user id>')
console.log(userInfo) // { name: '22', age: 18, avatar: '<imgage url>' }
```

## 运行 demo
1. `git clone git@github.com:hughfenghen/ts-rpc.git`  
2. `cd demo && yarn`  
3. `yarn server` 新开 shell 窗口，`yarn client`  

## 工作原理说明

![工作原理](https://raw.githubusercontent.com/hughfenghen/ts-rpc/master/rpc-desc.png)  

### Server

1. ts-brpc命令根据 json 配置，扫描对应目录的源文件  
2. 找到（RPCService、RPCMethod）标识的 class、method，写入_rpc_gen_meta_.json  
3. http 服务启动时，注入中间件（bindKoa、bindMidway）  
4. 中间件加载**_rpc_gen_meta_.json，**同时处理符合条件的 client 请求  
5. 根据请求 的url path 匹配，若匹配成功则执行 server 中对应calss 的 method  
6. 获取返回值后，写入 http body

### client

1. ts-brpc命令根据 json 配置，从 server 端同步_rpc_gen_meta_.json中的 dts  
2. 生成rpc-definition.ts，提供接口文档、类型校验、参数提示  
3. client 接口调用会被 agent 转换成 http 请求，发送给 server 端  
4. 从 server 端获取到请求后，解析返回值，返回给调用方  