import Koa from 'koa'
import Router from 'koa-router'
import path from 'path';
import { RPCService, startRPCDefinitionServer } from 'ts-rpc/server'

const app = new Koa()
const router = new Router();

const defStr = startRPCDefinitionServer(path.resolve(__dirname, './user-controller.ts'))

router.get('/_rpc_definiton_', (ctx, next) => {
  ctx.body = defStr()
  next()
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000)
