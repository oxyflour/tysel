import { AstNode, Literal, Id, Lambda, Apply } from './common'

export function compile(node: AstNode, env = { }): any {
    if (node instanceof Literal)
        return JSON.stringify(node.value)
    else if (node instanceof Id)
        return env[node.name]
    else if (node instanceof Lambda)
        return `(${node.arg.name} => ${compile(node.body, env)})`
    else if (node instanceof Apply)
        return `(${compile(node.func, env)})(${compile(node.arg, env)})`
    else
        throw 'not implemented'
}
