import {
    TypeVariable, TypeOperator, TypeEnv,
    IntegerType, BoolType, FunctionType,
    analyse
} from './src/types'

import { evaluate } from './src/interpreter'

import { compile } from './src/compiler'

import { parse } from './src/parser'

const log = e => (console.log(e), e)

function EXEC(source: string, valEnv: any, typeEnv: any) {
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

EXEC('(1 / 1) - (2 * 4) + 3', {
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
    '?':  a => (console.log(a), a),
}, {
    '+':  FunctionType(IntegerType, FunctionType(IntegerType, IntegerType)),
    '-':  FunctionType(IntegerType, FunctionType(IntegerType, IntegerType)),
    '*':  FunctionType(IntegerType, FunctionType(IntegerType, IntegerType)),
    '/':  FunctionType(IntegerType, FunctionType(IntegerType, IntegerType)),
    '>':  FunctionType(IntegerType, FunctionType(IntegerType, BoolType)),
    '<':  FunctionType(IntegerType, FunctionType(IntegerType, BoolType)),
    '>=': FunctionType(IntegerType, FunctionType(IntegerType, BoolType)),
    '<=': FunctionType(IntegerType, FunctionType(IntegerType, BoolType)),
    '==': FunctionType(IntegerType, FunctionType(IntegerType, BoolType)),
    '!=': FunctionType(IntegerType, FunctionType(IntegerType, BoolType)),
    '?':  (a => FunctionType(a, a))(new TypeVariable()),
})
