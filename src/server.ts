import { AAA } from 'AAA'
import 'reflect-metadata'

// const METHOD_METADATA = 'method'
const SERVICE_METADATA = 'path'

export function register (service: unknown): void {
  console.log(Reflect.getMetadata(service, SERVICE_METADATA))
}

export function Service () {
  return (target: Function) => {
    Reflect.defineMetadata(SERVICE_METADATA, target.name, target)
  }
}

AAA()
