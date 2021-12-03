import 'reflect-metadata'

export { RPCKey } from '../common'
export { bindKoa, bindMidway } from './bindings'

const SERVICE_METADATA = 'path'
const METHOD_METADATA = 'method'

export function RPCService () {
  return (target: Function) => {
    Reflect.defineMetadata(SERVICE_METADATA, target.name, target)
  }
}

export function RPCMethod () {
  return (
    target: Object,
    key: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => any>
  ) => {
    Reflect.defineMetadata(METHOD_METADATA, true, descriptor.value as Function)
  }
}
