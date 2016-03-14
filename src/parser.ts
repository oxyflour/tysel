import {
    AstNode, Literal, Id, Lambda, Apply,
    If, Let, Letrec, Cast,
} from './common'

const SEPS = /(\(|\)|\[|\]|{|})/g,
    INFIX = / (\+|-|\*|\/|>|<|>=|<=|==|!=|,|;|\:|\.) /g,
    UNFIX = / `(\+|-|\*|\/|>|<|>=|<=|==|!=|,|;|\:|\.) /g

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
                .setPosition(node.position)
        else if (head === 'let')
            return groupBySize(unfoldLet(rest).map(n => unfold(n, macros)), 2)
                .reduceRight((c, n) =>    new Let(n[0], n[1], c[0] || c))
                .setPosition(node.position)
        else if (head === 'letrec')
            return groupBySize(unfoldLet(rest).map(n => unfold(n, macros)), 2)
                .reduceRight((c, n) => new Letrec(n[0], n[1], c[0] || c))
                .setPosition(node.position)
                .precompile()
        else if (head === 'if')
            return groupBySize(rest.map(n => unfold(n, macros)), 2)
                .reduceRight((c, n) =>     new If(n[0], n[1], c[0] || c))
                .setPosition(node.position)
        else if (head === 'cast')
            return new Cast(
                unfold(rest[0], macros),
                // unfold (cast fn t1 tr) to (cast fn (\ v1 (cast (? true v1 t1) tr)))
                unfold(rest.slice(1, -1).reduce((c, n, i) =>
                    ['\\', 'cast_var_' + i, ['cast', ['?', 'true', n, 'cast_var_' + i], c]],
                    rest[rest.length - 1]), macros))
                .setPosition(node.position)
        else
            return node.map(n => unfold(n, macros))
                .reduce((c, n) => new Apply(c, n))
                .setPosition(node.position)
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
            node = node.reduce((l, n, i) => l.concat(['`;', n]), ['0'])
        else if (token === ']')
            node = node.reduce((l, n, i) => l.concat(['`:', n]), ['()'])
    }
    return node
}

function mark(source: string) {
    var chars = source
            .replace(/\[|\{/g, '(')
            .replace(/\]|\}/g, ')')
            .split(''),
        stack = [ [] ],
        map = { },
        colNum = 1, lineNum = 1
    chars.forEach((char, index) => {
        if (char === '\n')
            lineNum += (colNum = 1)
        else
            colNum ++

        if (char === '(') {
            var node = [ ] as any
            node.start = { lineNum, colNum, index }
            stack.push(node)
        }
        else if (char === ')') {
            var node = stack.pop() as any
            node.end = { lineNum, colNum, index }
            stack[stack.length - 1].push(node)

            var id = stack.map(x => x.length).join(':')
            map[id] = { start:node.start, end:node.end }
        }
    })

    return map
}

export function parse(source: string): AstNode {
    var tokens = source
            // create string
            .replace(/"([^"]*)"/g, (m, s) => "'" + btoa(s))
            // seperate words
            .replace(SEPS, ' $1 ')
            // update infix operators
            .replace(UNFIX, ' ``$1 ').replace(INFIX, ' `$1 ').replace(/ ``(\S+) /g, ' $1 ')
            // remove comments
            .replace(/;[^\n]*/g, '')
            // merge blanks
            .replace(/\s+/g, ' ')
            // split
            .split(' ').filter(x => x.length > 0),
        stack = [ [] ],
        map = mark(source)
    tokens.forEach(token => {
        if (token === '(' || token === '[' || token === '{') {
            var node = [ ] as any
            stack.push(node)
        }
        else if (token === ')' || token === ']' || token === '}') {
            var node = convertNode(stack.pop(), token)
            stack[stack.length - 1].push(node)

            var id = stack.map(x => x.filter(Array.isArray).length).join(':')
            node.position = map[id]
        }
        else {
            stack[stack.length - 1].push(token)
        }
    })
    return unfold(stack[0], { })
}
