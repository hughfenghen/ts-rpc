import * as TJS from 'typescript-json-schema'

export type TSchema = TJS.Definition

export type TRPCMetaData = Array<{
  name: string
  path: string
  methods: Array<{
    name: string
    decorators: string[]
    retSchema?: TJS.DefinitionOrBoolean
  }>
}>

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
  Return = '_ts_rpc_return_'
}

export interface Ctx {
  request: {
    body?: any
    query?: { [key: string]: string }
    headers: Record<string, string>
  }
  body: string
  path: string
  set: (k: string, v: string) => void
  method: string
  status: number
}

export interface IRPCConfig {
  appId: string
  server?: {
    scanDir: string[]
    metaOutDir: string
  }
  client?: {
    apps: Record<string, string>
    baseUrl: string
    genRPCDefintionTarget: string
    includeServices?: string[]
    mock?: {
      port: number
      fileMatch: string[]
    }
  }
}
