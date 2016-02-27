import { AstNode, Literal, Id, Lambda, Apply } from './common'

const INFIX = '+|-|*|/|>|<|>=|<=|==|!=|,|;'
    .split('|').reduce((d, c) => (d[c] = 1, d), { })

const SEPS = /(\(|\)|\[|\]|{|}|,|;)/g

function unfold(node: any): AstNode {
    if (Array.isArray(node)) {
        var head = node[0]
        if (head === '\\') {
            var body = node.length > 3 ? [head].concat(node.slice(2)) : node[2]
            return new Lambda(new Id(node[1]), unfold(body))
        }
        else if (head === 'let') {
            var body = node.length > 4 ? [head].concat(node.slice(3)) : node[3]
            return unfold([
                ['\\', node[1], body],
                node[2]])
        }
        else if (head === 'letrec') {
            var body = node.length > 4 ? [head].concat(node.slice(3)) : node[3]
            return unfold([
                ['\\', node[1], body],
                ['Y', ['\\', node[1], node[2]]]])
        }
        else if (head === 'if') {
            var body = node.length > 4 ? [head].concat(node.slice(3)) : node[3]
            return unfold([
                ['?', node[1],
                    ['\\', '_', node[2]],
                    ['\\', '_', body]],
                '0'])
        }
        else {
            var func = node.length > 2 ? node.slice(0, -1) : node[0],
                arg = node[node.length - 1]
            if (INFIX[ arg ]) [func, arg] = [arg, func]
            return new Apply(unfold(func), unfold(arg))
        }
    }
    else {
        // TODO: support more types
        if (+node == node)
            return new Literal(+node)
        else if (node === 'true' || node === 'false')
            return new Literal(node === 'true')
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
    var tokens = source.replace(SEPS, ' $1 ')
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
    return unfold(stack[0])
}
