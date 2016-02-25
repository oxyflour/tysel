import {
    functionType,
    TypeVariable, TypeOperator, TypeEnv,
    analyse
} from './types'

import { evaluate } from './interpreter'

import { parse } from './parser'

const NumberType = new TypeOperator(typeof(0), []),
    BoolType = new TypeOperator(typeof(true), [])

class Pair {
    constructor(public head, public tail) { }
}

export const values = {
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

    ',': a => b => new Pair(a, b),
    'pair?': a => a instanceof Pair,
    'head': a => a.head,
    'tail': a => a.tail,

    '?':  t => a => b => t === true ? a : b,
    // http://matt.might.net/articles/...
    //        implementation-of-recursive-fixed-point-y-combinator-...
    //        in-javascript-for-memoization/
    'Y':  evaluate(parse('\\ F (F (\\ x ((Y F) x)))')),
}

export const types = {
    '+':  functionType(NumberType, NumberType, NumberType),
    '-':  functionType(NumberType, NumberType, NumberType),
    '*':  functionType(NumberType, NumberType, NumberType),
    '/':  functionType(NumberType, NumberType, NumberType),
    '>':  functionType(NumberType, NumberType, BoolType),
    '<':  functionType(NumberType, NumberType, BoolType),
    '>=': functionType(NumberType, NumberType, BoolType),
    '<=': functionType(NumberType, NumberType, BoolType),
    '==': functionType(NumberType, NumberType, BoolType),
    '!=': functionType(NumberType, NumberType, BoolType),

    ',':  ((a, b) => functionType(a, b, new TypeOperator('*', [a, b])))(new TypeVariable, new TypeVariable),
    'pair?': functionType(new TypeVariable, BoolType),
    'head': (a => functionType(a, a))(new TypeVariable),
    'tail': functionType(new TypeVariable, NumberType),

    '?':  (a => functionType(BoolType, a, a, a))(new TypeVariable),
    // https://en.wikipedia.org/wiki/Fixed-point_combinator#Type_for_the_Y_combinator
    'Y':  (a => functionType(functionType(a, a), a))(new TypeVariable),
}