import glob from 'glob'
import { Project, Node, ClassDeclaration, FunctionDeclaration, MethodDeclaration, InterfaceDeclaration, SyntaxKind, TypeReferenceNode, TypeAliasDeclaration, MethodSignature } from 'ts-morph'
import path from 'path'
import { existsSync } from 'fs'
import { IScanResult, TRPCMetaData } from '../interface'

export function scan (filePaths: string[]): IScanResult {
  const files = filePaths.map(f => glob.sync(f)).flat()
  const prj = new Project({ compilerOptions: { declaration: true } })
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

  const expInter = genSf.insertInterface(0, { name: 'ServiceCollection' })
  expInter.setIsExported(true)

  const rpcMetaData: TRPCMetaData = []
  refedClasses.forEach((c) => {
    const className = c.getName()
    if (className == null) throw Error('RPCService must be applied to a named class')
    const methods = findRPCMethods(c, rpcMethodDef)
    if (methods.length === 0) {
      throw Error(`RPCService(${className}) must have at least one method`)
    }
    rpcMetaData.push({
      name: className,
      path: c.getSourceFile().getFilePath(),
      methods: methods.map(m => ({ name: m.getName() }))
    })
    // 将 class 转换为 interface，模拟 rpc 的 protocol 声明
    const inter = genSf.addInterface({ name: className })
    inter.addJsDocs(c.getJsDocs().map(doc => doc.getStructure()))
    inter.addMethods(
      methods.map(m => {
        const ms = m.getSignature().getDeclaration() as MethodSignature
        let rtText = ms.getReturnType().getText()
        // 远程调用，返回值都是 Promise
        if (!/^Promise<.+>$/.test(rtText)) {
          rtText = `Promise<${rtText}>`
        }
        ms.setReturnType(rtText)
        return ms.getStructure()
      })
    )

    methods.map(m => collectMethodTypeDeps(m))
      .flat()
      .forEach(it => {
        // 添加 method 依赖的类型，否则无法编译通过
        if (it instanceof InterfaceDeclaration) {
          genSf.insertInterface(1, it.getStructure())
        } else if (it instanceof TypeAliasDeclaration) {
          genSf.insertTypeAlias(1, it.getStructure())
        } else {
          // TODO: error
        }
      })

    expInter.addProperty({ name: className, type: className })
  })

  // 疑似 ts-morph 的 bug，会出多许多重复的 interface Promise
  genSf.getInterfaces().forEach(it => {
    if (it.getName() === 'Promise') {
      it.remove()
    }
  })

  const protocolFileContent = genSf.getEmitOutput({ emitOnlyDtsFiles: true })
    .getOutputFiles().map(file => file.getText())
    .join('\n')
  return {
    dts: protocolFileContent,
    meta: rpcMetaData
  }
}

function findRPCMethods (service: ClassDeclaration, rpcMethodDef: FunctionDeclaration): MethodDeclaration[] {
  return service.getMethods()
    .filter(m => m.getDecorators().some(
      d => d.getNameNode()
        .getDefinitionNodes()
        .some(n => n === rpcMethodDef)
    ))
}

type ITDeclaration = InterfaceDeclaration | TypeAliasDeclaration
export function collectMethodTypeDeps (method: MethodDeclaration): ITDeclaration[] {
  return [...method.getParameters(), method.getReturnTypeNodeOrThrow()]
    .map(n => collectTypeDeps(n))
    .flat()
}

export function collectTypeDeps (t: Node): ITDeclaration[] {
  const typeRefDeclarationSet = new Set<ITDeclaration>()

  if (t instanceof TypeReferenceNode) {
    findITDeclaration(t)
  } else if (isITDeclaration(t)) {
    typeRefDeclarationSet.add(t)
  }

  // 深度优先遍历树，找到引用Type类型，然后找到 Declaration
  queryInTree(t)

  return Array.from(typeRefDeclarationSet)

  function queryInTree (n: Node): void {
    n.forEachChild(c => {
      if (c instanceof TypeReferenceNode) findITDeclaration(c)

      queryInTree(c)
    })
  }

  function isITDeclaration (n: Node): n is ITDeclaration {
    return n instanceof InterfaceDeclaration ||
      n instanceof TypeAliasDeclaration
  }

  function findITDeclaration (n: Node): void {
    n.getChildrenOfKind(SyntaxKind.Identifier)
      .map(i => i.getSymbol())
      .flat()
      .map(s => s?.getDeclarations())
      .flat()
      .forEach(d => {
        if (d != null && isITDeclaration(d)) typeRefDeclarationSet.add(d)
      })
  }
}
