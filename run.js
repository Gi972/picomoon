'use strict'

const glob = require('glob')
const compileAndReload = require('./compile-reload')
const watch = require('./watch')

module.exports = cli => {
  const files = [].concat.apply([], cli.args.map(x =>
    glob.sync(x)
  ))
  files.forEach(compileAndReload(cli))
  if (cli.watch) watch(cli)(files)
}