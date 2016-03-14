import {
    AstType, TypeOperator, TypeVariable, TypeEnv,
    functionType, unify
} from './types'

type EvalEnv = any

export interface AstNode {
    evaluate(env: EvalEnv): any
    analyse(env: TypeEnv, nonGeneric: Set<AstType>): AstType
    compile(map): string
}

export class WithPosition {
    position
    setPosition(p) {
        this.position = p
        return this
    }
}

export class Literal implements AstNode {
    constructor(public value: any) { }
    toString() { return typeof(this.value) }
    evaluate(env: EvalEnv) {
        return this.value
    }
    analyse(env: TypeEnv) {
        return new TypeOperator(typeof(this.value), [])
    }
    compile(map) {
        return JSON.stringify(this.value)
    }
}

export class Id implements AstNode {
    constructor(public name: string) { }
    toString() { return this.name }
    evaluate(env: EvalEnv) {
        if (this.name in env)
            return env[this.name]
        throw 'undefined variable `' + this.name + '`'
    }
    analyse(env: TypeEnv, nonGeneric: Set<AstType>) {
        return env.get(this.name, nonGeneric)
    }
    compile(map) {
        return map[this.name] || this.name
    }
}

export class Lambda extends WithPosition implements AstNode {
    constructor(public arg: Id, public body: AstNode) { super() }
    toString() { return `(fn ${this.arg} => ${this.body})` }
    evaluate(env: EvalEnv) {
        // returns a true javascript function
        return arg => {
            var fenv = Object.assign({}, env, { [this.arg.name]:arg })
            return this.body.evaluate(fenv)
        }
    }
    analyse(env: TypeEnv, nonGeneric: Set<AstType>) {
        let argType = new TypeVariable(),
            newEnv = env.extend(this.arg, argType),
            newGeneric = new Set(Array.from(nonGeneric).concat(argType)),
            retType = this.body.analyse(newEnv, newGeneric)
        return functionType(argType, retType)
    }
    compile(map) {
        return '(' + this.arg.compile(map) + ' => ' + this.body.compile(map) + ')'
    }
}

export class Apply extends WithPosition implements AstNode {
    constructor(public func: AstNode, public arg: AstNode) {
        super()
        if (arg instanceof Id && arg.name[0] === '`')
            [this.func, this.arg] = [new Id(arg.name.substr(1)), func]
    }
    toString() { return `(${this.func} ${this.arg})` }
    evaluate(env: EvalEnv) {
        try {
            return Apply.evaluate(
                this.func.evaluate(env),
                this.arg.evaluate(env),
                this.func)
        }
        catch (e) {
            throw {
                message: e.message || e,
                position: e.position || this.position,
            }
        }
    }
    analyse(env: TypeEnv, nonGeneric: Set<AstType>) {
        try{
            let funcType = this.func.analyse(env, nonGeneric),
                argType = this.arg.analyse(env, nonGeneric),
                retType = new TypeVariable()
            unify(functionType(argType, retType), funcType)
            return retType
        }
        catch (e) {
            throw {
                message: e.message || e,
                position: e.position || this.position,
            }
        }
    }
    compile(map) {
        return this.func.compile(map) + '(' + this.arg.compile(map) + ')'
    }

    static evaluate(func, arg, name) {
        if (typeof(func) === 'function')
            return func['call'](null, arg)
        throw 'the function `' + name + '` is not applicable'
    }
}

export class Composite extends WithPosition implements AstNode {
    constructor(public node: AstNode) {
        super()
    }
    evaluate(env: EvalEnv) {
        try {
            return this.node.evaluate(env)
        }
        catch (e) {
            throw {
                message: e.message || e,
                position: e.position || this.position,
            }
        }
    }
    analyse(env: TypeEnv, nonGeneric: Set<AstType>) {
        try {
            return this.node.analyse(env, nonGeneric)
        }
        catch (e) {
            throw {
                message: e.message || e,
                position: e.position || this.position,
            }
        }
    }
    compile(map) {
        return this.node.compile(map)
    }
}

export class If extends Composite {
    constructor(public test: AstNode, public actionA: AstNode, public actionB: AstNode) {
        super([
            new Id('?'), test,
            new Lambda(new Id('_'), actionA),
            new Lambda(new Id('_'), actionB),
            new Literal(0)
        ].reduce((c, n) => new Apply(c, n)))
    }
    compile(map) {
        return '(' + this.test.compile(map) + ' === true) ? ' +
            '(' + this.actionA.compile(map) + ') : ' +
            '(' + this.actionB.compile(map) + ')'
    }
}

export class Let extends Composite {
    constructor(public variable: Id, public value: AstNode, public expression: AstNode) {
        super(new Apply(new Lambda(variable, expression), value))
    }
}

export class Letrec extends Composite {
    defs: Letrec[] = [ ]
    body: AstNode
    constructor(public variable: Id, public value: AstNode, public expression: AstNode) {
        super(new Apply(
            new Lambda(variable, expression),
            new Apply(new Id('Y'), new Lambda(variable, value))))
    }
    precompile() {
        var node = this
        while (node instanceof Letrec) {
            this.defs.push(node)
            node = node.expression as any
        }
        this.body = node
        return this
    }
    compile(map) {
        var defs = this.defs.map(def => def.variable.compile(map) + ' = ' + def.value.compile(map)),
            vars = defs.length > 0 ? 'var ' + defs.join(', ') + '; ' : ''
        return '(() => { ' + vars + 'return ' + this.body.compile(map) + ' })()'
    }
}

export class Cast extends Composite {
    constructor(public value: AstNode, public type: AstNode) {
        super(value)
    }
    analyse(env: TypeEnv, nonGeneric: Set<AstType>) {
        return this.type.analyse(env, nonGeneric)
    }
}

export class Import extends Composite {
    constructor(public name: Id, public path: AstNode, public body: AstNode) {
        super(new Apply(
            new Apply(new Id('import!'), path),
            new Lambda(name, body)))
    }
}