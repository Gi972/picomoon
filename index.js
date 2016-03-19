#!/usr/bin/env node
'use strict'

const pjson = require('./package')
const path = require('path')
const cli = require('commander')

cli
  .version(pjson.version)
  .usage('[options] <file ...>')
  .option('-l, --language [name]','Input file language. defaults to "lua"', /^(moonscript|javascript|js|lua)$/i, 'lua')
  .option('-x, --root [path]',    'Path to pico-8 carts. defaults to "~/Library/Application Support/pico-8/carts"', path.join(process.env.HOME, '/Library/Application Support/pico-8/carts'))
  .option('-o, --output [file]',  'Write output to file')
  .option('-p, --print',          'Write output to std out')
  .option('-w, --watch',          'Watch file')
  .option('-r, --reload',         'Reload PICO-8 after write')
  .parse(process.argv)

require('./run')(cli)