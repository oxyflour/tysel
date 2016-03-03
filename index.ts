import { TypeEnv } from './src/types'

import { AstNode, Apply } from './src/common'

import { parse } from './src/parser'

import { values, types, compilePrelude, compileVarRemap } from './src/buildins'

function runVM(exp, values) {
    var stack: [AstNode, any, boolean][] = [ [exp, values, true] ],
        func = null

    function step() {
        var [node, env, isFunc] = stack.pop()
        if (node instanceof Apply)
            stack.push([node.arg, env, false], [node.func, env, true])
        else if (isFunc)
            func = node.evaluate(env)
        else
            func = Apply.evaluate(func, node.evaluate(env), '')
    }

    while (stack.length)
        step()
    return func
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
    console.log(src)
}
catch (e) {
    console.error('ERR: ' + (e && e.message || e))
}
