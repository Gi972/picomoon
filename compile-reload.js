'use strict'

const compile = require('./compile')
const reload = require('./reload')

module.exports = cli => filepath => {
  const built = compile(cli)(filepath)
  if (built && cli.reload) reload(cli)(filepath)
}