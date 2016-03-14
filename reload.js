'use strict'

const path = require('path')
const exec = require('child_process').execSync

module.exports = cli => filepath => {
  console.log('reloading PICO-8...')
  const filename = cli.output || path.basename(filepath, '.moon')
  exec(
    `osascript ` + 
    `-e 'tell application "PICO-8" to activate' `+ 
    `-e 'tell application "System Events" \n key code 53 \n "load ${filename}" \n key code 36 \n delay .1 \n key code 15 using control down \n end tell' `
  )
}