import {
    AstType, functionType,
    TypeVariable, TypeOperator, TypeEnv,
    analyse
} from './src/types'

import { evaluate } from './src/interpreter'

import { compile } from './src/compiler'

import { parse } from './src/parser'

function EXEC(source: string, valEnv: any, typeEnv: any) {
    const log = e => (console.log(e.toString()), e)

    try {
        var exp = log(parse(source)),
            type = log(analyse(exp, new TypeEnv(typeEnv), new Set())),
            ret = log(evaluate(exp, valEnv))
        return ret
    }
    catch (e) {
        console.log('ERR: ' + (e && e.message || e))
    }
}

const IntegerType = new TypeOperator(typeof(0), []),
    BoolType = new TypeOperator(typeof(true), []),
    PairType = ((a, b) => functionType(a, b, new TypeOperator('*', [a, b])))(new TypeVariable(), new TypeVariable())

EXEC('1 : 2 : 3 : 4 : 5', {
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
    ':':  a => b => ({ a, b, toString(){ return '[' + a + ',' + b + ']' } }),
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
    ':':  PairType,
})
