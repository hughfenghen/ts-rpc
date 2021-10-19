import 'reflect-metadata'

const SERVICE_METADATA = 'path'
const METHOD_METADATA = 'method'

export function register (service: unknown): void {
  console.log(Reflect.getMetadata(service, SERVICE_METADATA))
}

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

export { scan } from './rpc-definition-scan'
