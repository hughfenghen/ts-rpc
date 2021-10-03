import { ServiceCollection } from './__service-collection__'

interface ServiceCfg {
  host: string
  prefixPath: string
  devMode: boolean
}
export function createRetmoteService (cfg: ServiceCfg): ServiceCollection {
  return {}
}
