import {
	AstType, TypeOperator, TypeVariable, TypeEnv,
	functionType, unify
} from './types'

type EvalEnv = any

class Closure {
	constructor(public lambda: Lambda, public environment: EvalEnv) { }
}

const INFIX = '+|-|*|/|>|<|>=|<=|==|!=|,|;|.'
    .split('|').reduce((d, c) => (d[c] = 1, d), { })

export interface AstNode {
	evaluate(env: EvalEnv): any
	analyse(env: TypeEnv, nonGeneric: Set<AstType>): AstType
	compile(map): string
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

export class Lambda implements AstNode {
    constructor(public arg: Id, public body: AstNode) { }
    toString() { return `(fn ${this.arg} => ${this.body})` }
    evaluate(env: EvalEnv) {
    	return new Closure(this, env)
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
    static fromList(...args) {
    	return new Lambda(args[0],
    		args.length > 2 ? Lambda.fromList(...args.slice(1)) : args[1])
    }
}

export class Apply implements AstNode {
    constructor(public func: AstNode, public arg: AstNode) { }
    toString() { return `(${this.func} ${this.arg})` }
    evaluate(env: EvalEnv) {
	    var func = this.func.evaluate(env),
	        arg = this.arg.evaluate(env)
	    if (func instanceof Closure) {
	        var { lambda, environment } = func,
	            fenv = Object.assign({}, environment, { [lambda.arg]:arg })
	        return lambda.body.evaluate(fenv)
	    }
	    else if (typeof(func) === 'function')
	        return func['call'](null, arg)
	    else
	        throw 'the function `' + this.func + '` is not applicable'
    }
    analyse(env: TypeEnv, nonGeneric: Set<AstType>) {
        let funcType = this.func.analyse(env, nonGeneric),
            argType = this.arg.analyse(env, nonGeneric),
            retType = new TypeVariable()
        unify(functionType(argType, retType), funcType)
        return retType
    }
    compile(map) {
    	return this.func.compile(map) + '(' + this.arg.compile(map) + ')'
    }
    static fromList(...args: AstNode[]) {
    	var func = args.length > 2 ? Apply.fromList(...args.slice(0, -1)) : args[0],
    		arg = args[args.length - 1]
    	if (arg instanceof Id) {
    		if (INFIX[arg.name])
    			[func, arg] = [arg, func]
    		else if (arg.name[0] === '`')
    			[func, arg] = [new Id(arg.name.substr(1)), func]
    	}
    	return new Apply(func, arg)
    }
}

export class If implements AstNode {
	node: AstNode
	constructor(public test: AstNode, public actionA: AstNode, public actionB: AstNode) {
		this.node = Apply.fromList(
			new Id('?'), this.test,
			new Lambda(new Id('_'), this.actionA),
			new Lambda(new Id('_'), this.actionB),
			new Literal(0))
	}
	evaluate(env: EvalEnv) {
		return this.node.evaluate(env)
	}
	analyse(env: TypeEnv, nonGeneric: Set<AstType>) {
		return this.node.analyse(env, nonGeneric)
	}
	compile(map) {
		return '(' + this.test.compile(map) + ' === true) ? ' +
			'(' + this.actionA.compile(map) + ') : ' +
			'(' + this.actionB.compile(map) + ')'
	}
	static fromList(...args) {
		return new If(args[0], args[1],
			args.length > 3 ? If.fromList(...args.slice(2)) : args[2])
	}
}

export class Let implements AstNode {
	node: AstNode
	constructor(public variable: Id, public value: AstNode, public expression: AstNode) {
		this.node = new Apply(new Lambda(variable, expression), value)
	}
	evaluate(env: EvalEnv) {
		return this.node.evaluate(env)
	}
	analyse(env: TypeEnv, nonGeneric: Set<AstType>) {
		return this.node.analyse(env, nonGeneric)
	}
	compile(map) {
		return this.node.compile(map)
	}
	static fromList(...args) {
		return new Let(args[0], args[1],
			args.length > 3 ? Let.fromList(...args.slice(2)) : args[2])
	}
}

export class Letrec implements AstNode {
	node: AstNode
	defs: [Id, AstNode][] = [ ]
	body: AstNode
	constructor(public variable: Id, public value: AstNode, public expression: AstNode) {
		this.node = new Apply(
			new Lambda(variable, expression),
			new Apply(new Id('Y'), new Lambda(variable, value)))
	}
	evaluate(env: EvalEnv) {
		return this.node.evaluate(env)
	}
	analyse(env: TypeEnv, nonGeneric: Set<AstType>) {
		return this.node.analyse(env, nonGeneric)
	}
	compile(map) {
		var defs = this.defs.map(def => def[0].compile(map) + ' = ' + def[1].compile(map)),
			vars = defs.length > 0 ? 'var ' + defs.join(', ') + '; ' : ''
		return '(() => { ' + vars + 'return ' + this.body.compile(map) + ' })()'
	}
	static fromList(...args) {
		var node = new Letrec(args[0], args[1],
			args.length > 3 ? Letrec.fromList(...args.slice(2)) : args[2])
		for (var i = 0; i < args.length - 1; i += 2)
			node.defs.push([args[i], args[i + 1]])
		node.body = args[args.length - 1]
		return node
	}
}
