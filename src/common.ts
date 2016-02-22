export interface AstNode {
}

export class Literal implements AstNode {
    constructor(public value: any) { }
    toString() { return typeof(this.value) }
}

export class Id implements AstNode {
    constructor(public name: string) { }
    toString() { return this.name }
}

export class Lambda implements AstNode {
    constructor(public arg: Id, public body: AstNode) { }
    toString() { return `(fn ${this.arg} => ${this.body})` }
}

export class Apply implements AstNode {
    static INFIX = '+|-|*|/|>|<|>=|<=|==|!='
        .split('|').reduce((d, c) => (d[c] = 1, d), { })

    constructor(public func: AstNode, public arg: AstNode) {
        var a = arg.toString()
        if (Apply.INFIX[a])
            [this.func, this.arg] = [arg, func]
    }
    toString() { return `(${this.func} ${this.arg})` }
}

export class Let implements AstNode {
    constructor(public variable: Id, public value: AstNode, public body: AstNode) { }
    toString() { return `(let ${this.variable} = ${this.value} in ${this.body})` }
}

export class Letrec implements AstNode {
    constructor(public variable: Id, public value: AstNode, public body: AstNode) { }
    toString() { return `(letrec ${this.variable} = ${this.value} in ${this.body})` }
}
