import Koa from 'koa'
import path from 'path'
import { bindKoa } from 'ts-brpc/server'

const app = new Koa()

app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*')
  await next()
})

// 不依赖 bodyparser 也能解析出参数
// app.use(bodyParser())

bindKoa({
  app,
  rpcMetaPath: path.resolve(__dirname, '../_rpc_gen_meta_.json'),
  prefixPath: '/'
}).catch((err) => {
  console.error(err)
})

app.listen(3000)
