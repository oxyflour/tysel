import {
    functionType,
    TypeVariable, TypeOperator, TypeEnv,
} from './types'

import {
    parse
} from './parser'

declare function require(module: string): any
declare function fetch(url: string): Promise<any>

const cononicalPath = require('canonical-path'),
    dirName = require('utils-dirname')
const IMPORT_CACHE = { }
const doImport = url => new Promise((resolve, reject) => {
    var source
    fetch(url)
        .then(resp => resp.text())
        .then(text => {
            var code = parse(source = text)
            code.analyse(new TypeEnv(Object.assign({}, types, {
                // ...
            }) as any), new Set())
            code.evaluate(Object.assign({}, values, {
                'import!': makeImport(dirName(url)),
                'export!': resolve
            }))
        })
        .catch(err => {
            if (err.message)
                console.error('ERR:', err.message)
            if (err.position && source) {
                var p = err.position
                console.error('AT:' + url + ':' + p.start.lineNum + ':' + p.start.colNum,
                    source.substring(p.start.index, p.end.index + 1))
            }
            reject(err)
        })
})
export const makeImport = base => path => callback => {
    var url = cononicalPath.normalize(base + '/' + path)
    if (!IMPORT_CACHE[url])
        IMPORT_CACHE[url] = doImport(url)
    IMPORT_CACHE[url].then(callback)
}

const VOID = () => VOID,
    ECHO = t => (console.log(t), ECHO),
    // http://matt.might.net/articles/...
    //        implementation-of-recursive-fixed-point-y-combinator-...
    //        in-javascript-for-memoization/
    Y = F => F(x => Y(F)(x))

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

    '()': null,
    'unit?': a => a === null,

    ':':  a => b => [a, b],
    'list?': a => Array.isArray(a),
    'head': a => a[0],
    'tail': a => a[1],

    'void': VOID,
    'echo': ECHO,
    'cast': a => b => a,

    'throw': a => { throw a },

    'Y': Y,

    'import!': makeImport('./lib'),
    'export!': ECHO,
}

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

    'import!': functionType(StringType, functionType(new TypeVariable, new TypeVariable)),
    'export!': functionType(new TypeVariable, new TypeVariable),
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
    '!':  '$B$NOT',
    '+':  '$B$ADD',
    '-':  '$B$MINUS',
    '*':  '$B$TIMES',
    '/':  '$B$DIV',
    '>':  '$B$GT',
    '<':  '$B$LT',
    '>=': '$B$GE',
    '<=': '$B$LE',
    '==': '$B$EQ',
    '!=': '$B$NEQ',
    '?':  '$B$IF',
    ';':  '$B$BEGIN',
    '.':  '$B$PROP',
    ':':  '$B$LIST',
    '()': '$B$NULL',
    'unit?': '$B$isNull',
    'list?': '$B$isArray',
    'void' : '$B$VOID',
    'throw': '$B$THROW',
    'import!': '$B$IMPORT',
    'export!': '$B$EXPORT',
}
const compilePreludeArray = [ ]
Object.keys(compileConsts).forEach((k, i) => {
    var name = compileVarRemap[k] || k
    compilePreludeArray.push(name + ' = ' + compileConsts[k])
})
export const compilePrelude = 'var ' + compilePreludeArray.join(', ') + '; '
