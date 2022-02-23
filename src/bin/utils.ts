import { ClassDeclaration, EnumDeclaration, ImportTypeNode, InterfaceDeclaration, ModuleDeclaration, Project, SourceFile, TypeAliasDeclaration, TypeReferenceNode, Node, ImportSpecifier, SyntaxKind } from 'ts-morph'

/**
 * 向SourceFile中插入Namespace，隔离命名空间，避免命名冲突
 */
export function insertNS (sf: SourceFile, appId: string): {
  ns: ModuleDeclaration
  rpcServices: InterfaceDeclaration
} {
  const appNS = sf.addModule({ name: `${appId}NS` })
  const appInterColl = appNS.addInterface({ name: 'App' })
  appNS.setIsExported(true)
  appInterColl.setIsExported(true)

  return {
    ns: appNS,
    rpcServices: appInterColl
  }
}

// 收集依赖树只考虑这四种场景
export type ITCDeclaration =
  | InterfaceDeclaration
  | TypeAliasDeclaration
  | ClassDeclaration
  | EnumDeclaration

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

export function isStandardType (n: Node): boolean {
  return /typescript\/lib|@types\/node/.test(n.getSourceFile().getFilePath())
}

export function addNode (container: ModuleDeclaration, n: Node): ITCDeclaration | null {
  if (n instanceof InterfaceDeclaration) {
    return container.addInterface(n.getStructure())
  } else if (n instanceof TypeAliasDeclaration) {
    return container.addTypeAlias(n.getStructure())
  } else if (n instanceof EnumDeclaration) {
    return container.addEnum(n.getStructure())
  } else if (n instanceof ClassDeclaration) {
    return container.addClass(n.getStructure())
  }
  return null
}
