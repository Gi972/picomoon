:crescent_moon: Picomoon
--

Compile Lua, JS, or [Moonscript](http://moonscript.org/) to .p8 carts on-the-fly!

![demo](screenshots/demo.gif)


Installation
--

    npm i -g picomoon

Dependencies
__

You'll need some binaries available in your `$PATH` if you want to compile from languages other than Lua:

Moonscript:
[moonc](http://moonscript.org/) - for compiling moonscript

Javascript:
[castl](https://github.com/PaulBernier/castl) - for compiling js


Usage
--

    Usage: picomoon [options] <file ...>

    Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -l, --language [name]  Input file language. default to "moonscript"
    -x, --root [path]      Path to pico-8 carts. defaults to "~/Library/Application Support/pico-8/carts"
    -o, --output [file]    Write output to file
    -p, --print            Write output to std out
    -w, --watch            Watch file
    -r, --reload           Reload PICO-8 after write

Examples
--

Compile a .lua file to a .p8 cart with the same name:

    picomoon my_cart.lua

Compile a .lua file to a .p8 cart with a different name:

    picomoon -o my_cart2 my_cart.lua

Compile a .moon file to a .p8 cart:

    picomoon -l moonscript my_cart.lua

Compile and watch a .js file for changes and auto-reload the compiled cart in pico-8:
    
    picomoon -wrl javascript my_cart.js

Compile and print output to stdout:

    picomoon -p my_cart.js


