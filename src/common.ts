
export type TRPCMetaData = Array<{ name: string, path: string, methods: Array<{ name: string }> }>

export interface IScanResult {
  dts: string
  meta: TRPCMetaData
}

export type TRPCMetaFile = IScanResult & { appId: string }

/**
 * 通信过程中，从（http）协议包获取指定 key 作为参数或反馈至
 */
export enum RPCKey {
  Args = '_ts_rpc_args_',
  Return = '_ts_rpc_return'
}
