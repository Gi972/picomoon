'use strict'

const watcher = require('chokidar')
const compileAndReload = require('./compile-reload')

module.exports = cli => files => {
  watcher
    .watch(files)
    .on('change', compileAndReload(cli))
}