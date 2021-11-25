
export type TRPCMetaData = Array<{ name: string, path: string, methods: Array<{ name: string }> }>

export interface IScanResult {
  dts: string
  meta: TRPCMetaData
}

export type TRPCMetaFile = IScanResult & { appId: string }
