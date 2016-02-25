// a typescript implement of hindley-milner type inference
// reference http://smallshire.org.uk/sufficientlysmall/2010/04/11/
// a-hindley-milner-type-inference-implementation-in-python/

/// <reference path="../typings/lib.es6.d.ts" />

import { AstNode, Literal, Id, Lambda, Apply } from './common'

export interface AstType {
}

export class TypeVariable implements AstType {
    constructor() { }
    toString() {
        return this.instance ? this.instance.toString() : this.name
    }

    instance: AstType
    _name: string
    get name() {
        return this._name || (this._name = 't' + (TypeVariable.lastNameIndex++))
    }

    static lastNameIndex = 0
}

export class TypeOperator implements AstType {
    constructor(public name: string, public types: AstType[]) { }
    toString() {
        if (this.types.length === 0)
            return this.name
        else if (this.types.length === 2)
            return `(${this.types[0]} ${this.name} ${this.types[1]})`
        else
            return `${this.name} ${this.types.join(' ')}`
    }
}

// ...
export class TypeEnv {
    constructor(public map: { [name: string]: AstType } = {}) {
    }
    get(name: any, nonGenerics: Set<AstType>) {
        if (name in this.map)
            return fresh(this.map[name], nonGenerics)
        throw 'undefined symbol: ' + name
    }
    extend(name: any, val: AstType) {
        return new TypeEnv(Object.assign({}, this.map, { [name]: val }))
    }
}

function fresh(type: AstType, nonGeneric: Set<AstType>) {
    const mappings: WeakMap<AstType, AstType> = new WeakMap()

    function freshrec(type: AstType): AstType {
        type = prune(type)
        if (type instanceof TypeVariable) {
            if (isGeneric(type, nonGeneric)) {
                if (!mappings.has(type))
                    mappings.set(type, new TypeVariable())
                return mappings.get(type)
            }
            else {
                return type
            }
        }
        else if (type instanceof TypeOperator) {
            return new TypeOperator(type.name, type.types.map(freshrec))
        }
        else {
            throw 'unexpected type to fresh'
        }
    }

    return freshrec(type)
}

function unify(type1: AstType, type2: AstType) {
    let t1 = prune(type1),
        t2 = prune(type2)
    if (t1 instanceof TypeVariable) {
        if (t1 !== t2) {
            if (occursInType(t1, t2))
                throw 'recurive unification'
            t1.instance = t2
        }
    }
    else if (t1 instanceof TypeOperator && t2 instanceof TypeVariable) {
        unify(t2, t1)
    }
    else if (t1 instanceof TypeOperator && t2 instanceof TypeOperator) {
        if (t1.name === t2.name && t1.types.length === t2.types.length)
            t1.types.forEach((t, i) => unify(t1.types[i], t2.types[i]))
        else
            throw 'type mismatch: ' + t1 + ' != ' + t2
    }
    else {
        throw 'unexpected types to unify'
    }
}

function prune(type: AstType) {
    if (type instanceof TypeVariable && type.instance)
        return type.instance = prune(type.instance)
    return type
}

function isGeneric(type: TypeVariable, nonGenerics: Set<AstType>) {
    return !occursInTypes(type, Array.from(nonGenerics))
}

function occursInType(type: TypeVariable, typeIn: AstType) {
    typeIn = prune(typeIn)
    if (typeIn === type)
        return true
    else if (typeIn instanceof TypeOperator)
        return occursInTypes(type, typeIn.types)
    return false
}

function occursInTypes(type: TypeVariable, types: AstType[]) {
    return types.some(t => occursInType(type, t))
}

export function functionType (...args: AstType[]) {
    var list = args.slice(), last = list.pop()
    return list.reduceRight((c, a) => new TypeOperator('->', [a, c]), last)
}

export function analyse(node: AstNode, envOrMap: any, nonGeneric: Set<AstType> = new Set()) {
    var env: TypeEnv = envOrMap instanceof TypeEnv ? envOrMap : new TypeEnv(envOrMap)

    if (node instanceof Literal) {
        return new TypeOperator(typeof(node.value), [])
    }
    else if (node instanceof Id) {
        return env.get(node.name, nonGeneric)
    }
    else if (node instanceof Apply) {
        let funcType = analyse(node.func, env, nonGeneric),
            argType = analyse(node.arg, env, nonGeneric),
            retType = new TypeVariable()
        unify(functionType(argType, retType), funcType)
        return retType
    }
    else if (node instanceof Lambda) {
        let argType = new TypeVariable(),
            newEnv = env.extend(node.arg, argType),
            newGeneric = new Set(Array.from(nonGeneric).concat(argType)),
            retType = analyse(node.body, newEnv, newGeneric)
        return functionType(argType, retType)
    }
    else {
        throw 'unhandled syntax node ' + node
    }
}
