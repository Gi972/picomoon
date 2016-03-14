'use strict'

const fs = require('fs')
const path = require('path')
const exec = require('child_process').execSync
const emptyCart = require('./empty-cart')

module.exports = cli => filepath => {
  const filename = cli.output || path.basename(filepath, '.moon')
  const cartPath = path.join(cli.root,`${filename}.p8`)
  let cart = emptyCart
  console.log('compiling %s -> %s/%s.p8', filepath, cli.root, filename)
  try {
    cart = fs.readFileSync(cartPath, 'utf8')
  } catch(err) {
    if (err.code === 'ENOENT') {
      console.log('creating new cart')
    } else {
      console.log(e)
      process.exit(1)
    }
  }
  // from __lua__ to __gfx__ (including __lua__)
  const prevLua = cart.substring(
    cart.indexOf('__lua__'),
    cart.lastIndexOf('__gfx__')
  )
  console.log('saving cart')  
  // moon -> lua
  let nextLua
  try {
    nextLua = '__lua__\n'+exec(`moonc -p ${filepath}`)
  } catch(err) {
    return console.error(err.message)
  }
  // write
  if (cli.print) fs.writeFileSync(
    cartPath,
    cart.replace(prevLua, nextLua),
    'utf8'
  )
  else console.log(cart.replace(prevLua, nextLua))
  console.log('...saved!')
  return true
}
