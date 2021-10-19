import Koa from 'koa'

interface IKoaArgs {
  app: Koa
  scanDir: string[]
  prefixPath: string
}

export function bindKoa ({ app, scanDir, prefixPath }: IKoaArgs): void {

}
