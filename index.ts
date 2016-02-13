import {
    TypeVariable, TypeOperator, TypeEnv,
    IntegerType, BoolType, FunctionType,
    analyse
} from './src/types'

import { evaluate } from './src/interpreter'

import { compile } from './src/compiler'

import { parse } from './src/parser'

// ...
const type1 = new TypeVariable(),
    type2 = new TypeVariable(),
    type3 = new TypeVariable()

const env = new TypeEnv({
    pair: FunctionType(type1, FunctionType(type2, new TypeOperator('*', [type1, type2]))),
    cond: FunctionType(BoolType, FunctionType(type3, FunctionType(type3, type3))),
    zero: FunctionType(IntegerType, BoolType),
    pred: FunctionType(IntegerType, IntegerType),
    times: FunctionType(IntegerType, FunctionType(IntegerType, IntegerType)),
})

;[
    `letrec factorial
        (lambda n
            (cond (zero n) 0
                (times n (factorial (pred n)))))
        (factorial 0)`,
    `lambda x (pair (x 0) (x true))`,
    `pair (f 0) (f true)`,
    `let f (lambda x x) (pair (f 0) (f true))`,
    `lambda f (f f)`,
    `let g (lambda f 0) (g g)`,
    `lambda g (let f (lambda x g) (pair (f 0) (f true)))`,
    `lambda f g a (g (f a))`,
].forEach(tree => {
    let exp = parse(tree)
    try {
        console.log(exp + ' :: ' + analyse(exp, env, new Set()))
    }
    catch (e) {
        console.log(exp + ' :: ' + (e.message || e))
    }
})

var result = evaluate(parse('? (+ 1 1)'), {
    '+': a => b => a + b,
    '?': a => (console.log(a), a)
})
console.log(result)

var source = compile(parse('? (+ 1 1)'), {
    '+': 'a => b => a + b',
    '?': 'a => (console.log(a), a)'
})
console.log(source)
