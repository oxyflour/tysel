import { AstType, TypeOperator, TypeVariable, TypeEnv,
	functionType, unify } from './types'

type EvalEnv = any

class Closure {
	constructor(public lambda: Lambda, public environment: EvalEnv) { }
}

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
}
