import glob from 'glob'
import { Project, Node, ClassDeclaration, FunctionDeclaration, MethodDeclaration, InterfaceDeclaration, SyntaxKind, TypeReferenceNode, TypeAliasDeclaration, MethodSignature } from 'ts-morph'
import path from 'path'

export async function startRPCDefinitionServer (filePaths: string): Promise<() => string> {
  const files = glob.sync(filePaths)
  const prj = new Project({ compilerOptions: { declaration: true } })
  files.forEach(file => {
    return prj.addSourceFileAtPath(file)
  })
  const serverSf = prj.addSourceFileAtPath(path.resolve(__dirname, './index.ts'))
  const rpcServiceDef = serverSf.getFunction('RPCService')
  const rpcMethodDef = serverSf.getFunction('RPCMethod')
  if (rpcServiceDef == null || rpcMethodDef == null) throw Error('Cannot find RPCService or RPCMethod definition')

  const refedClasses = rpcServiceDef?.findReferencesAsNodes()
    // symbol <- callexpress <- decorator <- class
    .map(ref => ref.getParent()?.getParent()?.getParent())
    .filter(n => Node.isClassDeclaration(n)) as ClassDeclaration[]

  const genSf = prj.createSourceFile(path.resolve(__dirname, '_protocol-file-memory_.ts'), {
  }, { overwrite: true })

  refedClasses.forEach((c) => {
    const className = c.getName()
    if (className == null) throw Error('RPCService must be applied to a named class')
    // 将 class 转换为 interface，模拟 rpc 的 protocol 声明
    const inter = genSf.addInterface({ name: className })
    inter.addJsDocs(c.getJsDocs().map(doc => doc.getStructure()))
    const methods = findRPCMethods(c, rpcMethodDef)
    inter.addMethods(
      methods.map(m => (
        m.getSignature().getDeclaration() as MethodSignature
      ).getStructure())
    )

    methods.map(m => collectMethodTypeDeps(m))
      .flat()
      .forEach(it => {
        // 添加 method 依赖的类型，否则无法编译通过
        if (it instanceof InterfaceDeclaration) {
          genSf.insertInterface(0, it.getStructure())
        } else if (it instanceof TypeAliasDeclaration) {
          genSf.insertTypeAlias(0, it.getStructure())
        } else {
          // TODO: error
        }
      })
  })

  const protocolFileContent = genSf.getEmitOutput({ emitOnlyDtsFiles: true })
    .getOutputFiles().map(file => file.getText())
    .join('\n')
  return () => protocolFileContent
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
