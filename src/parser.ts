import {
    AstNode, Literal, Id, Lambda, Apply,
    If, Let, Letrec,
} from './common'

const SEPS = /(\(|\)|\[|\]|{|})/g

function groupBySize(arr: any[], size: number): any[] {
    return Array(Math.floor(arr.length / size) + 1).fill(0)
        .map((_, i) => arr.slice(i * size, (i + 1) * size))
}

function unfoldLet(arr: any[]) {
    for (var i = 0; i < arr.length - 1; i += 2)
        if (Array.isArray(arr[i])) {
            arr[i + 1] = ['\\', ...arr[i].slice(1), arr[i + 1]]
            arr[i] = arr[i][0]
        }
    return arr
}

function replaceNode(node: any, macros) {
    if (Array.isArray(node))
        return node.map(n => replaceNode(n, macros))
    return node in macros ? macros[node] : node
}

function unfoldMacro(arr: any[], macros) {
    macros = Object.assign({ }, macros)
    for (var i = 0; i < arr.length - 1; i += 2) {
        var def = arr[i], val = arr[i + 1]
        if (Array.isArray(def))
            macros['(' + def[0] + ')'] = [def.slice(1), val]
        else
            macros[def] = val
    }
    return macros
}

function unfold(node: any, macros): AstNode {
    if (Array.isArray(node)) {
        var [head, ...rest] = node
        if (head === 'macro') {
            macros = unfoldMacro(rest, macros)
            return unfold(replaceNode(rest[rest.length - 1], macros), macros)
        }
        else if (macros['(' + head + ')']) {
            // TODO: use pattern match to test macro here
            var [args, body] = macros['(' + head + ')']
            macros = Object.assign({ }, macros)
            args.forEach((n, i) => macros[n] = rest[i])
            return unfold(replaceNode(body, macros), macros)
        }
        else if (head === '\\')
            return rest.map(n => unfold(n, macros))
                .reduceRight((c, n) => new Lambda(n, c))
        else if (head === 'let')
            return groupBySize(unfoldLet(rest).map(n => unfold(n, macros)), 2)
                .reduceRight((c, n) =>    new Let(n[0], n[1], c[0] || c))
        else if (head === 'letrec')
            return groupBySize(unfoldLet(rest).map(n => unfold(n, macros)), 2)
                .reduceRight((c, n) => new Letrec(n[0], n[1], c[0] || c))
                .precompile()
        else if (head === 'if')
            return groupBySize(rest.map(n => unfold(n, macros)), 2)
                .reduceRight((c, n) =>     new If(n[0], n[1], c[0] || c))
        else
            return node.map(n => unfold(n, macros))
                .reduce((c, n) => new Apply(c, n))
    }
    else {
        // TODO: support more types
        if (+node == node)
            return new Literal(+node)
        else if (node === 'true' || node === 'false')
            return new Literal(node === 'true')
        else if (node && node[0] === "'")
            return new Literal(atob(node.substr(1)))
        else
            return new Id(node)
    }
}

function convertNode(node, token) {
    if (Array.isArray(node)) {
        if (token === '}')
            node = node.reduce((l, n, i) => l.concat([';', n]), ['0'])
        else if (token === ']')
            node = node.reduce((l, n, i) => l.concat([',', n]), ['()'])
    }
    return node
}

export function parse(source: string): AstNode {
    var tokens = source
            // create string
            .replace(/"([^"]+)"/g, (m, s) => "'" + btoa(s))
            // seperate words
            .replace(SEPS, ' $1 ')
            // remove comments
            .replace(/;[^\n]*/g, '')
            // split
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
