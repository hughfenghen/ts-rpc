import Koa from 'koa'
import path from 'path'
import bodyParser from 'koa-bodyparser'
// import { bindKoa } from 'ts-rpc/server'
import { bindKoa } from '../../src/server'

const app = new Koa()
app.use(bodyParser())

app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*')
  await next()
})

bindKoa({
  app,
  rpcMetaPath: path.resolve(__dirname, '../_rpc_gen_meta_.json'),
  prefixPath: '/'
}).catch((err) => {
  console.error(err)
})

app.listen(3000)
