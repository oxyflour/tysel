import { analyse } from './src/types'

import { evaluate } from './src/interpreter'

import { compile } from './src/compiler'

import { parse } from './src/parser'

import { values, types } from './src/buildins'

declare function require(module: string): any

var source = require('raw!./lib/index.lisp')

function exec(source: string) {
    var exp = parse(source),
        val, type
    try {
        type = analyse(exp, types)
        val = evaluate(exp, values)
    }
    catch (e) {
        console.log('ERR: ' + (e && e.message || e))
    }
    return { exp, type, val }
}

exec(source)
