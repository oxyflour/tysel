import { TypeEnv } from './src/types'

import { parse } from './src/parser'

import { values, types, compilePrelude, compileVarRemap } from './src/buildins'

declare function require(module: string): any

var source = require('raw!./lib/index.lisp')

function exec(source: string) {
    var exp = parse(source),
        type, val
    try {
        type = exp.analyse(new TypeEnv(types as any), new Set())
        val = exp.evaluate(values)
        var src = exp.compile(compileVarRemap)
        console.log(src)
        console.log(val, eval(compilePrelude + src))
    }
    catch (e) {
        console.log('ERR: ' + (e && e.message || e))
    }
    return { exp, type, val }
}

exec(source)
