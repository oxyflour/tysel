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
    '!' : a => !a,
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
    ';':  a => b => b,

    '()': new Unit(),
    'unit?': a => a instanceof Unit,

    ',':  a => b => new List(a, b),
    'list?': a => a instanceof List,
    'head': a => a.head,
    'tail': a => a.tail,

    'echo': t => (console.log(t), values.echo),
}

// the Y combinator is so tricky
// http://matt.might.net/articles/...
//        implementation-of-recursive-fixed-point-y-combinator-...
//        in-javascript-for-memoization/
values['Y'] = evaluate(parse('\\ F (F (\\ x ((Y F) x)))'), values)

export const types = {
    '!':  functionType(BoolType, BoolType),
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
    '?':  (a => functionType(BoolType, a, a, a))(new TypeVariable),
    ';':  ((a, b) => functionType(a, b, b))(new TypeVariable, new TypeVariable),

    '()': ListType,
    'unit?': functionType(ListType, BoolType),

    ',':  functionType(ListType, ListItemType, ListType),
    'list?': functionType(ListType, BoolType),
    'head': functionType(ListType, ListType),
    'tail': functionType(ListType, ListItemType),

    'echo': functionType(new TypeVariable, new TypeVariable),

    // https://en.wikipedia.org/wiki/Fixed-point_combinator#Type_for_the_Y_combinator
    'Y':  (a => functionType(functionType(a, a), a))(new TypeVariable),
}