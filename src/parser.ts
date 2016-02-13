import { AstNode, Literal, Id, Lambda, Apply, Let, Letrec } from './common'

function convert(node: any): AstNode {
    if (Array.isArray(node)) {
        var head = node[0]
        if (head === 'lambda' && node.length > 3)
            return new Lambda(new Id(node[1]), convert(['lambda'].concat(node.slice(2))))
        else if (head === 'lambda')
            return new Lambda(new Id(node[1]), convert(node[2]))
        else if (head === 'let')
            return new Let(new Id(node[1]), convert(node[2]), convert(node[3]))
        else if (head === 'letrec')
            return new Letrec(new Id(node[1]), convert(node[2]), convert(node[3]))
        else if (node.length > 2)
            return new Apply(convert(node.slice(0, -1)), convert(node.slice(-1)[0]))
        else
            return new Apply(convert(node[0]), convert(node[1]))
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

export function parse(source: string): AstNode {
    var tokens = source.replace(/(\(|\))/g, ' $1 ')
            .replace(/\s+/g, ' ').replace(/\s+$/, '').split(' '),
        stack = [ [] ]
    tokens.forEach(token => {
        if (token === '(')
            stack.push([ ])
        else if (token === ')')
            stack[stack.length - 2].push(stack.pop())
        else
            stack[stack.length - 1].push(token)
    })
    return convert(stack[0])
}
