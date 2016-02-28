import { AstNode, Literal, Id, Lambda, Apply } from './common'

const INFIX = '+|-|*|/|>|<|>=|<=|==|!=|,|;'
    .split('|').reduce((d, c) => (d[c] = 1, d), { })

const SEPS = /(\(|\)|\[|\]|{|})/g

function unfold(node: any, macros): AstNode {
    if (Array.isArray(node)) {
        var head = node[0]
        if (head === '\\') {
            var body = node.length > 3 ? [head].concat(node.slice(2)) : node[2]
            return new Lambda(new Id(node[1]), unfold(body, macros))
        }
        else if (head === 'macro') {
            var body = node.length > 4 ? [head].concat(node.slice(3)) : node[3],
                id = node[1], value = node[2]
            if (Array.isArray(id)) {
                value = [id.slice(1), value]
                id = id[0]
            }
            macros = Object.assign({ }, macros, { [id]:value })
            return unfold(body, macros)
        }
        else if (macros[head]) {
            var [args, body] = macros[head],
                vals = node.slice(1)
            macros = Object.assign({ }, macros)
            args.forEach((n, i) => macros[n] = vals[i])
            return unfold(body, macros)
        }
        else if (head === 'let') {
            var body = node.length > 4 ? [head].concat(node.slice(3)) : node[3],
                variable = node[1], value = node[2]
            if (Array.isArray(variable)) {
                value = ['\\'].concat(variable.slice(1)).concat([node[2]])
                variable = variable[0]
            }
            return unfold([
                ['\\', variable, body],
                value
            ], macros)
        }
        else if (head === 'letrec') {
            var body = node.length > 4 ? [head].concat(node.slice(3)) : node[3],
                variable = node[1], value = node[2]
            if (Array.isArray(variable)) {
                value = ['\\'].concat(variable.slice(1)).concat([node[2]])
                variable = variable[0]
            }
            return unfold([
                ['\\', variable, body],
                ['Y', ['\\', variable, value]]
            ], macros)
        }
        else if (head === 'if') {
            var body = node.length > 4 ? [head].concat(node.slice(3)) : node[3]
            return unfold([
                ['?', node[1],
                    ['\\', '_', node[2]],
                    ['\\', '_', body]
                ],
                '0',
            ], macros)
        }
        else {
            var func = node.length > 2 ? node.slice(0, -1) : node[0],
                arg = node[node.length - 1]
            if (INFIX[ arg ]) [func, arg] = [arg, func]
            return new Apply(unfold(func, macros), unfold(arg, macros))
        }
    }
    else {
        // TODO: support more types
        if (+node == node)
            return new Literal(+node)
        else if (node === 'true' || node === 'false')
            return new Literal(node === 'true')
        else if (macros[node])
            return unfold(macros[node], macros)
        else
            return new Id(node)
    }
}

function convertNode(node, token) {
    if (Array.isArray(node)) {
        if (token === '}')
            node = node.reduce((l, n, i) => l.concat([';', n]), ['0'])
        else if (token === ']')
            node = node.reduce((l, n, i) => l.concat([',', n]), ['unit'])
    }
    return node
}

export function parse(source: string): AstNode {
    var tokens = source.replace(SEPS, ' $1 ').replace(/;[^\n]*/g, '')
            .replace(/\s+/g, ' ').split(' ').filter(x => x.length > 0),
        stack = [ [] ]
    tokens.forEach(token => {
        if (token === '(' || token === '[' || token === '{')
            stack.push([ ])
        else if (token === ')' || token === ']' || token === '}')
            stack[stack.length - 2].push(convertNode(stack.pop(), token))
        else
            stack[stack.length - 1].push(token)
    })
    return unfold(stack[0], { })
}
