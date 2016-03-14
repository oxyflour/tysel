import { makeImport } from './src/buildins'

makeImport('/')('lib/index.lisp')(console.log.bind(console))
