import { AstNode, Literal, Id, Lambda, Apply } from './common'

function apply(node: Apply, env) {
    var func = evaluate(node.func, env),
        arg = evaluate(node.arg, env)
    if (Array.isArray(func)) {
        var [ lambda, environment ] = func,
            fenv = Object.assign({}, environment, { [lambda.arg]:arg })
        return evaluate(lambda.body, fenv)
    }
    else if (typeof(func) === 'function')
        return func['call'](null, arg)
    else
        throw 'the function `' + node.func + '` is not applicable'
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
        return apply(node, env)
    else
        throw 'not implemented'
}
