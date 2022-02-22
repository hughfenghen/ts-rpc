import glob from 'glob'
import { Project, Node, ClassDeclaration, FunctionDeclaration, MethodDeclaration, InterfaceDeclaration, SyntaxKind, TypeReferenceNode, TypeAliasDeclaration, MethodSignature, ImportTypeNode, ImportSpecifier, TypeAliasDeclarationStructure, EnumDeclaration } from 'ts-morph'
import path from 'path'
import { existsSync } from 'fs'
import { IScanResult, TRPCMetaData } from '../common'

export function scan (
  filePaths: string[],
  appId: string,
  opts?: {
    tsConfigFilePath?: string
  }
): IScanResult {
  const files = filePaths.map(f => glob.sync(f)).flat()
  const prj = new Project({
    compilerOptions: {
      declaration: false,
      sourceMap: false,
      isolatedModules: true
    },
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

  const genSf = prj.createSourceFile(path.resolve(__dirname, '_protocol-file-memory_.ts'), {
  }, { overwrite: true })

  // namespace 避免命名冲突
  const appNS = genSf.addModule({ name: `${appId}NS` })
  const appInterColl = appNS.addInterface({ name: 'App' })
  appNS.setIsExported(true)
  appInterColl.setIsExported(true)

  // 简化 export type = xxx 代码
  const expTypeSf = prj.createSourceFile('exp-type', `export type ${appId} = ${appId}NS.App`)
  // 导出 namespace 下对外的 interface
  genSf.addTypeAlias(expTypeSf.getTypeAlias(appId)?.getStructure() as TypeAliasDeclarationStructure)

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
      // 远程调用，返回值都是 Promise
      if (!/^Promise<.+>$/.test(rtText)) {
        rtText = `Promise<${rtText}>`
      }
      addedM.setReturnType(rtText)
    })

    // TODO: 性能优化，前面 method 已添加的 node 不必再查找
    methods.map(m => collectMethodTypeDeps(m, prj))
      .flat()
      .forEach(it => {
        const nodeName = it.getNameNode()?.getText()
        if (nodeName == null) throw new Error('dependency must be named')

        const sid = it.getSourceFile().getFilePath() + '/' + nodeName
        // 避免重复, ECMA标准依赖无须添加
        if (addedDepIds.includes(sid) || /typescript\/lib|@types\/node/.test(sid)) return

        if (addedDepIds.some(sid => sid.endsWith(`/${nodeName}`))) {
          console.warn(`Named duplicate: ${nodeName}`)
          return
        }
        addedDepIds.push(sid)

        // 添加 method 依赖的类型
        let added = null
        if (it instanceof InterfaceDeclaration) {
          added = appNS.insertInterface(1, it.getStructure())
        } else if (it instanceof TypeAliasDeclaration) {
          added = appNS.insertTypeAlias(1, it.getStructure())
        } else if (it instanceof EnumDeclaration) {
          added = appNS.insertEnum(1, it.getStructure())
        } else if (it instanceof ClassDeclaration) {
          added = appNS.insertClass(1, it.getStructure())
          // 只保留 class 的属性方法, 移除属性、class 的decorator 信息
          added.getDecorators().forEach(d => d.remove())
          added.getProperties()
            .forEach(p => p.getDecorators().forEach(d => d.remove()))
        } else {
          console.warn('unknown deps type')
        }
        added?.setIsExported(true)
      })

    appInterColl.addProperty({ name: className, type: className })
  })

  return {
    dts: genSf.getFullText(),
    meta: rpcMetaData
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

// 收集依赖树只考虑这四种场景
type ITCDeclaration =
  | InterfaceDeclaration
  | TypeAliasDeclaration
  | ClassDeclaration
  | EnumDeclaration

export function collectMethodTypeDeps (
  method: MethodDeclaration,
  prj: Project
): ITCDeclaration[] {
  return [...method.getParameters(), method.getReturnTypeNodeOrThrow()]
    .map(n => collectTypeDeps(n, prj))
    .flat()
}

export function collectTypeDeps (t: Node, prj: Project): ITCDeclaration[] {
  const depsMap = new Set<ITCDeclaration>()

  function addDep (n: ITCDeclaration): void {
    if (depsMap.has(n)) return
    const nodeName = n.getNameNode()?.getText()
    if (nodeName == null) throw new Error('dependency must be named')
    depsMap.add(n)
    // 被添加的依赖项，递归检查其依赖项
    queryInTree(n)
  }

  if (t instanceof TypeReferenceNode) {
    findITDeclaration(t)
  } else if (isITCDeclaration(t)) {
    addDep(t)
  }

  // 深度优先遍历树，找到引用Type类型，然后找到 Declaration
  queryInTree(t)

  return Array.from(depsMap.values())

  function queryInTree (n: Node): void {
    n.forEachChild(c => {
      if (c instanceof TypeReferenceNode) findITDeclaration(c)
      if (c instanceof ImportTypeNode) findIT4Import(c)

      queryInTree(c)
    })
  }

  // 收集依赖树只考虑这4种场景
  function isITCDeclaration (n: Node): n is ITCDeclaration {
    return n instanceof InterfaceDeclaration ||
      n instanceof TypeAliasDeclaration ||
      n instanceof ClassDeclaration ||
      n instanceof EnumDeclaration
  }

  function findITDeclaration (n: Node): void {
    n.getChildrenOfKind(SyntaxKind.Identifier)
      .map(i => i.getSymbol())
      .flat()
      .map(s => s?.getDeclarations())
      .flat()
      .forEach(d => {
        if (d == null) return
        if (isITCDeclaration(d)) addDep(d)
        else if (d instanceof ImportSpecifier) findIT4ImportSpecifier(d)
      })
  }

  // 解析动态 import 函数
  function findIT4Import (n: ImportTypeNode): void {
    const fPath = n.getArgument().getText().slice(1, -1)
    const sf = prj.getSourceFile(sf => sf.getFilePath().includes(fPath))
    if (sf == null) throw new Error(`Could not find file ${fPath}`)
    const impName = n.getQualifier()?.getText() ?? ''
    const declaration = sf.getInterface(impName) ?? sf.getTypeAlias(impName) ?? sf.getClass(impName)
    if (declaration == null) throw Error(`Could not find interface, class or type (${impName}) in ${fPath}`)

    addDep(declaration)
  }

  // 解析import语法，从其他文件中查找依赖项
  function findIT4ImportSpecifier (is: ImportSpecifier): void {
    const impSf = is.getImportDeclaration().getModuleSpecifierSourceFile()
    if (impSf == null) throw new Error(`Could not find import var ${is.getText()}`)

    const impName = is.getText()
    const declaration = impSf.getInterface(impName) ?? impSf.getTypeAlias(impName) ?? impSf.getClass(impName)
    if (declaration == null) throw Error(`Could not find interface, class or type (${impName}) in ${impSf.getFilePath()}`)

    addDep(declaration)
  }
}
