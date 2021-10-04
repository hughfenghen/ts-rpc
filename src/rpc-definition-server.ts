import glob from 'glob'
import * as ts from 'typescript'
import * as fs from 'fs'
import { eq, find, get, pipe, tap } from 'lodash/fp'
import { Project, Node, StructureKind, ClassDeclaration, ClassDeclarationStructure, FunctionDeclaration, MethodDeclaration } from 'ts-morph'

import { } from 'assert'
import path from 'path'

export async function startRPCDefinitionServer (filePaths: string): Promise<() => string> {
  const files = glob.sync(filePaths)
  // console.log(3333, files)
  const prj = new Project({ compilerOptions: { declaration: true } })
  await files.map(file => {
    // collectRPCServiceAST(file)
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
    // methods: [{
    //   name: 'test',
    //   returnType: 'string',
    //   parameters: [{
    //     name: 'a',
    //     type: 'string'
    //   }]
    // }],
    methods: findRPCMethods(n, rpcMethodDef)
  })) as ClassDeclarationStructure[]

  // console.log(111, relateClasses)
  const sf = prj.createSourceFile(path.resolve(__dirname, '../dist/__gen__.ts'), {
    statements: simpleAST
  }, { overwrite: true })
  // sf.addClass({ name: 'Abc' }).getStructure()
  // await sf.save()
  console.log(222, sf.getEmitOutput({ emitOnlyDtsFiles: true }).getOutputFiles().map(file => file.getText()))
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
    .map(s => {
      console.log(5555, s)
      return s
    })
}

export async function collectRPCServiceAST (filePath: string): Promise<unknown[]> {
  return await new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, content) => {
      if (err != null) {
        reject(err)
        return
      }
      // const program = ts.createProgram([filePath], {
      //   target: ts.ScriptTarget.ES5,
      //   module: ts.ModuleKind.CommonJS
      // })

      // const checker = program.getTypeChecker()

      // program.getSourceFiles().forEach(sf => {
      //   if (!sf.isDeclarationFile) {
      //     parseRPCService4AST(sf, checker)
      //   }
      // })

      resolve([])
    })
    return []
  })
}

export function parseRPCService4AST (sf: ts.SourceFile, checker: ts.TypeChecker): void {
  let rpcServiceType: any = null
  let rpcServiceSymbol: ts.Symbol | null = null
  // checker.symbol
  // console.log(111, checker)
  ts.forEachChild(sf, (node) => {
    // const s = checker.getTypeAtLocation(node)
    // if (s != null) {
    //   console.log(99999, s)
    // }
    if (
      /ts-rpc\/.*server/.test(sf.fileName) &&
      ts.isFunctionDeclaration(node) &&
      node.name?.escapedText === 'RPCService'
    ) {
      rpcServiceSymbol = (node as any).symbol ?? checker.getSymbolAtLocation(node.name) as ts.Symbol
      rpcServiceType = checker.getTypeAtLocation(node.name)
      console.log(4444, rpcServiceSymbol)
    } else if (ts.isImportDeclaration(node)) {
      // rpcServiceTOken = pipe(
      //   get('importClause'),
      //   // tap(console.log.bind(null, 111)),
      //   get('namedBindings.elements'),
      //   find({ name: { escapedText: 'RPCService' } })
      // )(node)
      // console.log(222, rpcServiceTOken)
      // console.log(333, rpcServiceTOken.symbol, checker.getSymbolAtLocation(rpcServiceTOken))
    } else if (
      ts.isClassDeclaration(node) &&
      node.name != null
    ) {
      // node.decorators?.find()
      const rpcService = find({ expression: { expression: { escapedText: 'RPCService' } } }, node.decorators)
      if (rpcService == null) return

      // console.log(1111, (rpcService.expression as any).expression)
      // console.log(1111, checker.getSymbolAtLocation(rpcService.name))
      const symbol = checker.getSymbolAtLocation((rpcService.expression as any).expression)
      console.log(666, rpcServiceType === checker.getTypeAtLocation((rpcService.expression as any).expression))
      // console.log(777, symbol, (symbol as any).declarations[0].symbol === rpcServiceSymbol)
      // pipe(
      //   get('decorators[0]'),
      //   checker.getSymbolAtLocation,
      //   tap(console.log),
      //   eq(rpcServiceTOken),
      //   tap(console.log)
      // )(node)
    }
    return false
  })
  // console.log(111, sf.statements[0].importClause.namedBindings.elements[0].name)
  // IdentifierObject {
  //   pos: 8,
  //     end: 19,
  //       flags: 0,
  //         modifierFlagsCache: 0,
  //           transformFlags: 0,
  //             parent: undefined,
  //               kind: 79,
  //                 originalKeywordKind: undefined,
  //                   escapedText: 'RPCService'
  // }
}
