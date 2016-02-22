import { AstNode, Literal, Id, Lambda, Apply, Let, Letrec } from './common'

function unfold(node: any): AstNode {
    if (Array.isArray(node)) {
        var head = node[0]
        if (head === 'lambda') {
            var body = node.length > 3 ? ['lambda'].concat(node.slice(2)) : node[2]
            return new Lambda(new Id(node[1]), unfold(body))
        }
        else if (head === 'let' || head === 'letrec') {
            var Cls = head === 'let' ? Let : Letrec,
                body = node.length > 4 ? [head].concat(node.slice(3)) : node[3]
            return new Cls(new Id(node[1]), unfold(node[2]), unfold(body))
        }
        else {
            var func = node.length > 2 ? node.slice(0, -1) : node[0]
            return new Apply(unfold(func), unfold(node[node.length - 1]))
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

export function parse(source: string): AstNode {
    var tokens = source.replace(/(\(|\))/g, ' $1 ')
            .replace(/\s+/g, ' ').split(' ').filter(x => x.length > 0),
        stack = [ [] ]
    tokens.forEach(token => {
        if (token === '(')
            stack.push([ ])
        else if (token === ')')
            stack[stack.length - 2].push(stack.pop())
        else
            stack[stack.length - 1].push(token)
    })
    return unfold(stack[0])
}
