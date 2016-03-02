import {
    functionType,
    TypeVariable, TypeOperator, TypeEnv,
} from './types'

import { parse } from './parser'

const VOID = () => VOID,
    ECHO = t => (console.log(t), ECHO)

const NumberType = new TypeOperator(typeof(0), []),
    BoolType = new TypeOperator(typeof(true), []),
    StringType = new TypeOperator(typeof(''), []),
    ListItemType = new TypeVariable,
    ListType = new TypeOperator('[]', [ListItemType])

export const values = {
    '!':  a => !a,
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
    '.':  a => b => a[b],

    '()': NaN,
    'unit?': a => a !== a,

    ':':  a => b => [a, b],
    'list?': a => Array.isArray(a),
    'head': a => a[0],
    'tail': a => a[1],

    'void': VOID,
    'echo': ECHO,
    'cast': a => b => a,

    'throw': a => { throw a }
}

// the Y combinator is so tricky
// http://matt.might.net/articles/...
//        implementation-of-recursive-fixed-point-y-combinator-...
//        in-javascript-for-memoization/
values['Y'] = parse('\\ F (F (\\ x ((Y F) x)))').evaluate(values)

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
    '.':  ((a, b) => functionType(a, StringType, b))(new TypeVariable, new TypeVariable),

    '()': ListType,
    'unit?': functionType(ListType, BoolType),

    ':':  functionType(ListType, ListItemType, ListType),
    'list?': functionType(ListType, BoolType),
    'head': functionType(ListType, ListType),
    'tail': functionType(ListType, ListItemType),

    'void': functionType(new TypeVariable, new TypeVariable),
    'echo': functionType(new TypeVariable, new TypeVariable),
    'cast': (a => functionType(new TypeVariable, a, a))(new TypeVariable),

    'throw': functionType(new TypeVariable, new TypeVariable),

    // https://en.wikipedia.org/wiki/Fixed-point_combinator#Type_for_the_Y_combinator
    'Y':  (a => functionType(functionType(a, a), a))(new TypeVariable),
}

const compileConsts = {
    '!': 'a => !a',
    '+':  'a => b => a + b',
    '-':  'a => b => a - b',
    '*':  'a => b => a * b',
    '/':  'a => b => a / b',
    '>':  'a => b => a > b',
    '<':  'a => b => a < b',
    '>=': 'a => b => a >= b',
    '<=': 'a => b => a <= b',
    '==': 'a => b => a === b',
    '!=': 'a => b => a !== b',
    '?':  't => a => b => t === true ? a : b',
    ';':  'a => b => b',
    '.':  'a => b => a[b]',
    ':':  'a => b => [a, b]',
    '()': 'null',
    'unit?': 'a => a === null',
    'head': 'a => a[0]',
    'tail': 'a => a[1]',
    'list?': 'Array.isArray',
    'Y': 'F => F(x => Y(F)(x))',
    'void': '() => VOID',
    'echo': 't => (console.log(t), echo)',
    'cast': 'a => b => a',
    'throw': 'e => { throw e }',
}
export const compileVarRemap = {
    '!':  'NOT',
    '+':  'ADD',
    '-':  'MINUS',
    '*':  'TIMES',
    '/':  'DIV',
    '>':  'GT',
    '<':  'LT',
    '>=': 'GE',
    '<=': 'LE',
    '==': 'EQ',
    '!=': 'NEQ',
    '?':  'IF',
    ';':  'BEGIN',
    '.':  'PROP',
    ':':  'LIST',
    '()': 'NULL',
    'unit?': 'isNull',
    'list?': 'isArray',
    'void' : 'VOID',
    'throw': 'THROW'
}
const compilePreludeArray = [ ]
Object.keys(compileConsts).forEach((k, i) => {
    var name = compileVarRemap[k] || k
    compilePreludeArray.push(name + ' = ' + compileConsts[k])
})
export const compilePrelude = 'var ' + compilePreludeArray.join(', ') + '; '
