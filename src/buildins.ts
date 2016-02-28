import {
    functionType,
    TypeVariable, TypeOperator, TypeEnv,
    analyse
} from './types'

import { evaluate } from './interpreter'

import { parse } from './parser'

const NumberType = new TypeOperator(typeof(0), []),
    BoolType = new TypeOperator(typeof(true), []),
    ListItemType = new TypeVariable,
    ListType = new TypeOperator('[]', [ListItemType])

class List {
    constructor(public head, public tail) { }
}

class Unit {
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

    'unit': new Unit(),

    'echo': t => (console.log(t), values.echo),

    ';':  a => b => b,

    ',':  a => b => new List(a, b),
    'list?': a => a instanceof List,
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

    'echo': functionType(new TypeVariable, new TypeVariable),

    ';':  ((a, b) => functionType(a, b, b))(new TypeVariable, new TypeVariable),

    ',':  functionType(ListType, ListItemType, ListType),
    'unit': ListType,
    'list?': functionType(ListType, BoolType),
    'head': functionType(ListType, ListType),
    'tail': functionType(ListType, ListItemType),

    '?':  (a => functionType(BoolType, a, a, a))(new TypeVariable),
    // https://en.wikipedia.org/wiki/Fixed-point_combinator#Type_for_the_Y_combinator
    'Y':  (a => functionType(functionType(a, a), a))(new TypeVariable),
}