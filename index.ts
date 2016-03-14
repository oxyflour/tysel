import { TypeEnv } from './src/types'

import { AstNode, Apply } from './src/common'

import { parse } from './src/parser'

import { values, types, compilePrelude, compileVarRemap } from './src/buildins'

declare function require(module: string): any

try {
    var source = require('raw!./lib/index.lisp'),
    	exp = parse(source),
        type = exp.analyse(new TypeEnv(types as any), new Set()),
        src = exp.compile(compileVarRemap)

    var val2 = exp.evaluate(values),
        val3 = eval(compilePrelude + src)
    console.log(val2, val3)
    console.log(src)
}
catch (e) {
    console.error('ERR:', e.message || e)
    var p = e.position
    if (p) console.error('AT:' + p.start.lineNum + ':' + p.start.colNum,
		source.substring(p.start.index, p.end.index+1))
}
