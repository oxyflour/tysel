import { AstNode, Literal, Id, Lambda, Apply, Let, Letrec } from './common'

function apply(func, arg, env) {
    if (Array.isArray(func)) {
        var [ lambda, environment ] = func
        return evaluate(lambda.body, Object.assign({}, env, { [lambda.arg]:arg }))
    }
    else if (typeof(func) === 'function')
        return func.call(null, arg)
    else
        throw 'the function is not applicable'
}

// ...
export function evaluate(node: AstNode, env = { }): any {
    if (node instanceof Literal)
        return node.value
    else if (node instanceof Id)
        return env[node.name]
    else if (node instanceof Lambda)
        return [node, env]
    else if (node instanceof Apply)
        return apply(evaluate(node.func, env), evaluate(node.arg, env), env)
    else if (node instanceof Let)
        return evaluate(new Apply(new Lambda(node.variable, node.body), node.value), env)
    else
        throw 'not implemented'
}
