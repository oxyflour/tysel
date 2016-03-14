import { TypeEnv } from './src/types'

import { AstNode, Apply } from './src/common'

import { parse } from './src/parser'

import { values, types, compilePrelude, compileVarRemap } from './src/buildins'

declare function require(module: string): any

try {
    var exp = parse(require('raw!./lib/index.lisp')),
        type = exp.analyse(new TypeEnv(types as any), new Set()),
        src = exp.compile(compileVarRemap)

    var val2 = exp.evaluate(values),
        val3 = eval(compilePrelude + src)
    console.log(val2, val3)
    console.log(src)
}
catch (e) {
    console.error('ERR: ' + (e && e.message || e))
}
