import glob from 'glob'
import { Project, Node, ClassDeclaration, FunctionDeclaration, MethodDeclaration, MethodSignature } from 'ts-morph'
import path from 'path'
import { existsSync } from 'fs'
import { IScanResult, TRPCMetaData } from '../common'
import { addNode, collectTypeDeps } from './utils'
import { dts2JSONSchema } from './dts-to-schema'

const nsName = (appId: string): string => `${appId}NS`
const EXP_SERVICES_NAME = 'App'
const EXP_RETURN_TYPES_NAME = 'APIReturnTypes'

export function scan (
  filePaths: string[],
  appId: string,
  opts?: {
    tsConfigFilePath?: string
  }
): IScanResult {
  const files = filePaths.map(f => glob.sync(f)).flat()
  const prj = new Project({
    tsConfigFilePath: opts?.tsConfigFilePath
  })
  files.forEach(file => {
    return prj.addSourceFileAtPath(file)
  })

  // 单测阶段
  const indexTs = path.resolve(__dirname, '../server/index.ts')
  // 编译后
  const indexDTs = path.resolve(__dirname, '../server/index.d.ts')
  const serverSf = prj.addSourceFileAtPath(
    existsSync(indexDTs) ? indexDTs : indexTs
  )
  const rpcServiceDef = serverSf.getFunction('RPCService')
  const rpcMethodDef = serverSf.getFunction('RPCMethod')
  if (rpcServiceDef == null || rpcMethodDef == null) throw Error('Cannot find RPCService or RPCMethod definition')

  const refedClasses = rpcServiceDef?.findReferencesAsNodes()
    // symbol <- callexpress <- decorator <- class
    .map(ref => ref.getParent()?.getParent()?.getParent())
    .filter(n => Node.isClassDeclaration(n)) as ClassDeclaration[]

  const genSf = prj.createSourceFile(
    path.resolve(__dirname, '_protocol-file-memory_.ts'),
    // unwarp promise 工具类型，后面 retTYpes 会用到
    'type UnwrapPromise<T> = T extends Promise<infer U> ? U : T',
    { overwrite: true }
  )

  // namespace 避免命名冲突
  const appNS = genSf.addModule({ name: nsName(appId) })
  const appInterColl = appNS.addInterface({ name: EXP_SERVICES_NAME })
  appNS.setIsExported(true)
  appInterColl.setIsExported(true)
  // 导出应用下聚合的 Service： export type AppID = AppIdNs.App;
  genSf.addTypeAlias({
    name: appId,
    type: `${appId}NS.App`,
    isExported: true
  })
  // 收集接口返回类型，用于 client 生成 json-schema
  const retTypes = appNS.addInterface({ name: EXP_RETURN_TYPES_NAME })
  retTypes.setIsExported(true)

  const rpcMetaData: TRPCMetaData = []
  // 已添加到 appNS 中的依赖，避免依赖项重复
  const addedDepIds: string[] = []
  // 遍历 class，将 class 转换为 interface，并将其依赖添加到 appNS
  refedClasses.forEach((c) => {
    const className = c.getName()

    if (className == null) throw Error('RPCService must be applied to a named class')
    if (appNS.getInterface(className) != null) throw Error(`RPCService marks duplicate class names: ${className}`)

    const methods = findRPCMethods(c, rpcMethodDef)
    if (methods.length === 0) {
      throw Error(`RPCService(${className}) must have at least one method`)
    }
    rpcMetaData.push({
      name: className,
      path: c.getSourceFile().getFilePath(),
      methods: methods.map(m => ({
        name: m.getName(),
        decorators: m.getDecorators().map(d => d.getText())
      }))
    })

    // 将 class 转换为 interface，模拟 rpc 的 protocol 声明
    const inter = appNS.addInterface({ name: className })
    inter.addJsDocs(c.getJsDocs().map(doc => doc.getStructure()))

    methods.forEach((m) => {
      // 移除原有decorator, 避免 bug：https://github.com/dsherret/ts-morph/issues/1214
      m.getDecorators().forEach(d => d.remove())
      // 移除 paramster 的 decorator，简化接口信息
      m.getParameters().forEach(p => {
        p.getDecorators().forEach(d => d.remove())
        // 移除参数初始值，class 将被转换为 interface， 而interface不支持初始值
        p.removeInitializer()
      })

      const ms = m.getSignature().getDeclaration() as MethodSignature
      const addedM = inter.addMethod(ms.getStructure())
      let rtText = addedM.getReturnTypeNode()?.getText()
      if (rtText == null) throw new Error(`Could not find method (${m.getName()}) return type`)

      // 返回类型不需要 promise 包围，影响生成的 schema，不便于 Mock 或 fast-stringify
      let nonPromiseType = rtText
      const promiseRegx = /^Promise<(.+)>$/
      if (promiseRegx.test(rtText)) {
        nonPromiseType = rtText.replace(promiseRegx, '$1')
      } else {
        // 远程调用，返回值都是 Promise
        rtText = `Promise<${rtText}>`
      }
      retTypes.addProperty({
        name: `'${className}.${m.getName()}'`,
        type: `UnwrapPromise<${nonPromiseType}>`
      })
      addedM.setReturnType(rtText)
    })

    // TODO： 重构优化以下代码
    collectTypeDeps(
      methods.map(m => [...m.getParameters(), m.getReturnTypeNodeOrThrow()]).flat(),
      prj
    ).forEach(it => {
      const nodeName = it.getNameNode()?.getText()
      if (nodeName == null) throw new Error('dependency must be named')

      const sid = it.getSourceFile().getFilePath() + '/' + nodeName
      // 避免重复
      if (addedDepIds.includes(sid)) return

      if (addedDepIds.some(sid => sid.endsWith(`/${nodeName}`))) {
        console.warn(`Named duplicate: ${nodeName}`)
        return
      }
      addedDepIds.push(sid)

      // 添加 method 依赖的类型
      const added = addNode(appNS, it)
      if (added instanceof ClassDeclaration) {
        // 只保留 class 的方法, 移除属性、class 的decorator 信息
        added.getDecorators().forEach(d => d.remove())
        added.getProperties()
          .forEach(p => p.getDecorators().forEach(d => d.remove()))
      }
      if (added == null) {
        console.warn(`unknown deps type: ${it.getText()}`)
      }
      added?.setIsExported(true)
    })

    appInterColl.addProperty({ name: className, type: className })
  })

  const code = genSf.getFullText()
  return {
    dts: code,
    meta: addReturnSchemToMeta(rpcMetaData, code, appId)
  }
}

function findRPCMethods (service: ClassDeclaration, rpcMethodDef: FunctionDeclaration): MethodDeclaration[] {
  return service.getMethods()
    .filter(m => m.getDecorators().some(
      d => {
        try {
          return d.getNameNode()
            .getDefinitionNodes()
            .some(n => n === rpcMethodDef)
        } catch (e) {
          return false
        }
      }
    ))
}

function addReturnSchemToMeta (meta: TRPCMetaData, code: string, appId: string): TRPCMetaData {
  const schema = dts2JSONSchema(code, `${nsName(appId)}.${EXP_RETURN_TYPES_NAME}`)
  const { properties } = schema ?? {}
  if (properties == null) return meta

  return meta.map((s) => ({
    ...s,
    methods: s.methods.map(m => ({
      ...m,
      retSchema: properties[`${s.name}.${m.name}`]
    }))
  }))
}
