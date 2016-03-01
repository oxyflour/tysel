import { TypeEnv } from './src/types'

import { Apply } from './src/common'

import { parse } from './src/parser'

import { values, types, compilePrelude, compileVarRemap } from './src/buildins'

function runVM(exp, values) {
    var stack: any[] = [ exp, values ], ret: any[] = [ ]
    function step() {
        var env = stack.pop(),
            node = stack.pop()
        if (node instanceof Apply) {
            stack.push(node.arg, env)
            stack.push(node.func, env)
            stack.push(null, null)
        }
        else if (node !== null && env !== null) {
            ret.push(node.evaluate(env))
        }
        else {
            var [func, arg] = ret, val
            ret = [Apply.evaluate(func, arg, '')]
        }
    }

    step()
    while (stack.length > 1)
        step()
    return ret[0]
}

declare function require(module: string): any

try {
    var exp = parse(require('raw!./lib/index.lisp')),
        type = exp.analyse(new TypeEnv(types as any), new Set()),
        src = exp.compile(compileVarRemap)

    var val1 = runVM(exp, values),
        val2 = exp.evaluate(values),
        val3 = eval(compilePrelude + src)
    console.log(val1, val2, val3)
}
catch (e) {
    console.log('ERR: ' + (e && e.message || e))
}
