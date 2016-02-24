import {
    AstType, functionType,
    TypeVariable, TypeOperator, TypeEnv,
    analyse
} from './src/types'

import { evaluate } from './src/interpreter'

import { compile } from './src/compiler'

import { parse } from './src/parser'

function exec(source: string, valEnv: any, typeEnv: any = null) {
    var exp = parse(source),
        val, type
    if (typeEnv) try {
        type = analyse(exp, new TypeEnv(typeEnv), new Set())
        val = evaluate(exp, valEnv)
    }
    catch (e) {
        console.log('ERR: ' + (e && e.message || e))
    }
    return { exp, type, val }
}

const IntegerType = new TypeOperator(typeof(0), []),
    BoolType = new TypeOperator(typeof(true), [])

var { exp, type, val } = exec(`
    letrec
        fac (\\ x (if (x > 1) (fac (x - 1) * x) x))
        x 5
        (fac x)
`, {
    '+':  a => b => a + b,
    '-':  a => b => a - b,
    '*':  a => b => a * b,
    '/':  a => b => a / b,
    '>':  a => b => a > b,
    '<':  a => b => a < b,
    '>=': a => b => a >= b,
    '<=': a => b => a <= b,
    '==': a => b => a === b,
    '!=': a => b => a !== b,

    '?':  t => a => b => t === true ? a : b,
    // http://matt.might.net/articles/...
    //        implementation-of-recursive-fixed-point-y-combinator-...
    //        in-javascript-for-memoization/
    'Y':  evaluate(parse('\\ F (F (\\ x ((Y F) x)))')),
}, {
    '+':  functionType(IntegerType, IntegerType, IntegerType),
    '-':  functionType(IntegerType, IntegerType, IntegerType),
    '*':  functionType(IntegerType, IntegerType, IntegerType),
    '/':  functionType(IntegerType, IntegerType, IntegerType),
    '>':  functionType(IntegerType, IntegerType, BoolType),
    '<':  functionType(IntegerType, IntegerType, BoolType),
    '>=': functionType(IntegerType, IntegerType, BoolType),
    '<=': functionType(IntegerType, IntegerType, BoolType),
    '==': functionType(IntegerType, IntegerType, BoolType),
    '!=': functionType(IntegerType, IntegerType, BoolType),

    '?':  (a => functionType(BoolType, a, a, a))(new TypeVariable),
    // https://en.wikipedia.org/wiki/Fixed-point_combinator#Type_for_the_Y_combinator
    'Y':  (a => functionType(functionType(a, a), a))(new TypeVariable),
})

console.log('' + exp, exp)
console.log('' + type, type)
console.log(val)
