import glob from 'glob'
import { Project, Node, StructureKind, ClassDeclaration, ClassDeclarationStructure, FunctionDeclaration, MethodDeclaration, SourceFile, InterfaceDeclaration, SyntaxKind, TypeReferenceNode, TypeAliasDeclaration } from 'ts-morph'
import path from 'path'

export async function startRPCDefinitionServer (filePaths: string): Promise<() => string> {
  const files = glob.sync(filePaths)
  // console.log(3333, files)
  const prj = new Project({ compilerOptions: { declaration: true } })
  const rpjSfs = files.map(file => {
    return prj.addSourceFileAtPath(file)
  })
  const serverSf = prj.addSourceFileAtPath(path.resolve(__dirname, './server.ts'))
  const rpcServiceDef = serverSf.getFunction('RPCService')
  const rpcMethodDef = serverSf.getFunction('RPCMethod')
  if (rpcServiceDef == null || rpcMethodDef == null) throw Error('Cannot find RPCService or RPCMethod definition')

  // console.log(111, rpcMethodDef)
  const relateClasses = rpcServiceDef?.findReferencesAsNodes()
    // symbol <- callexpress <- decorator <- class
    .map(ref => ref.getParent()?.getParent()?.getParent())
    .filter(n => Node.isClassDeclaration(n)) as ClassDeclaration[]

  const simpleAST = relateClasses.map(n => ({
    kind: StructureKind.Class,
    name: n.getName(),
    methods: findRPCMethods(n, rpcMethodDef)
  })) as ClassDeclarationStructure[]

  // console.log(111, relateClasses)
  const genSf = prj.createSourceFile(path.resolve(__dirname, '../dist/__gen__.ts'), {
    statements: simpleAST
  }, { overwrite: true })
  rpjSfs.forEach((sf) => {
    const uiStruct = sf.getInterface('UserInfo')?.getStructure()
    if (uiStruct != null) genSf.addInterface(uiStruct)
  })
  // sf.addClass({ name: 'Abc' }).getStructure()
  // await sf.save()
  console.log(222, genSf.getEmitOutput({ emitOnlyDtsFiles: true }).getOutputFiles().map(file => file.getText()))
  return () => ''
}

function findRPCMethods (service: ClassDeclaration, rpcMethodDef: FunctionDeclaration): Array<ReturnType<MethodDeclaration['getStructure']>> {
  return service.getMethods()
    .filter(m => m.getDecorators().some(
      d => d.getNameNode()
        .getDefinitionNodes()
        .some(n => n === rpcMethodDef)
    ))
    .map(m => m.getStructure())
}

type ITDeclaration = InterfaceDeclaration | TypeAliasDeclaration
export function collectMethodTypeDeps (method: MethodDeclaration, sfs: SourceFile[]): ITDeclaration[] {
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
