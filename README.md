# TS-RPC

## 使用方法

```ts
import { bindKoa, Service, Method } from 'ts-rpc'

bindKoa(User) // 或者 bindExpress

@Service()
class User {

  @Method()
  getInfoById(id: string): { name: string, age: number, avatar: string } {
    // 从上游获取数据
    return {
      name: '22',
      age: 18,
      avatar: '<image url>'
    }
  }
}

// TODO: ctx 信息怎么获取，错误处理 ？
```

```ts
// scripts: yarn run tsRPCAgent

import { RS } from 'ts-rpc'

const rs = new RS({
  host: '//localhost:3000',
  prefixPath: '/path',
  devMode: true,
  (sName, mName, args) => {
    // fetch('/user/getInfoById/')
  }
})

const userInfo = await rs.User.getInfoById('<user id>')
console.log(userInfo) // { name: '22', age: 18, avatar: '<imgage url>' }
```