> **NOTE:** This project is no longer being developed. Check out [p8](https://github.com/jozanza/p8/) instead! :)

:crescent_moon: Picomoon
--

Compile Lua, Javascript, or [MoonScript](http://moonscript.org/) to .p8 carts on-the-fly!

![demo](screenshots/demo.gif)


Installation
--

    npm i -g picomoon

Dependencies
--

You'll need some binaries available in your `$PATH` if you want to compile from languages other than Lua:

**MoonScript**: [moonc](http://moonscript.org/#installation)

**Javascript**: [castl](https://github.com/PaulBernier/castl)


Usage
--

    Usage: picomoon [options] <file ...>

    Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -l, --language [name]  Input file language. defaults to "lua"
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

    picomoon -l moonscript my_cart.moon

Compile and watch a .js file for changes and auto-reload the compiled cart in pico-8:
    
    picomoon -wrl javascript my_cart.js

Compile and print output to stdout:

    picomoon -p my_cart.lua


