interface IKoaArgs {
  app: {
    use: (
      path: string,
      handler: (ctx: unknown, next: () => Promise<void>) => Promise<void>
    ) => void
  }
  rpcMetaPath: string
  prefixPath: string
}

export async function bindKoa ({ app, rpcMetaPath, prefixPath }: IKoaArgs): Promise<void> {
  // const { dts, meta } = await import(rpcMetaPath)
}
