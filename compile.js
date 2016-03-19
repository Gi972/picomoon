'use strict'

const fs = require('fs')
const path = require('path')
const exec = require('child_process').execSync
const emptyCart = require('./empty-cart')

module.exports = cli => filepath => {
  const filename = cli.output || path.basename(filepath).replace(path.extname(filepath),'')
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
    nextLua = '__lua__\n' + getNextLua(cli.language, filepath)
  } catch(err) {
    return console.error(err.message)
  }
  // write
  if (cli.print) console.log(cart.replace(prevLua, nextLua))
  else fs.writeFileSync(
    cartPath,
    cart.replace(prevLua, nextLua),
    'utf8'
  )
  console.log('...saved!')
  return true
}

const getNextLua = (language, filepath) => {
  // Javascript
  if (/(javascript|js)/i.test(language))
    return compilers.javascript(filepath)
  // Moonscript
  if (/(moonscript)/i.test(language))
    return compilers.moonscript(filepath)
  // Lua
  if (/(lua)/i.test(language))
    return exec(`cat ${filepath}`)
  // Nope...
  console.error(`Sorry, picomoon can only compile the following languages: ${[
    'moonscript',
    'javascript',
    'lua'
  ]}`)
  process.exit(1)
}

const compilers = {
  lua(filepath) {
    return exec(`cat ${filepath}`)    
  },
  moonscript(filepath) {
    return exec(`moonc -p ${filepath}`)
  },
  javascript(filepath) {
    // CASTL's runtime adds some complications...
    const compiled = `${exec(`castl --cat ${filepath}`)}`
      // remove 'require("castl.runtime")'
      .replace('local _ENV = require("castl.runtime");', '')
      // remove '_ENV,'
      .replace(/(_ENV,|_ENV)/g, '')
      // prototypes
      .replace(/\.prototype/g, '_prototype')
      // falsey values
      .replace(/(null|NaN|undefined)/g, 'nil')
      // new keyword support
      .replace(/_new\((.*)\)/g, fn => {
        let args = fn.replace(/_new\(|\)/g,'').split(',')
        args.splice(1, 0, args[0]+'_prototype')
        return `_new(${args})`
      })
      .toLowerCase()
    // polyfills and builtins
    const shim = (
      polyfills.typeCoercions +
      polyfills.bitwiseOperations +
      polyfills.globalFunctions +
      polyfills.globalObjects +
      polyfills.keywords +
      polyfills.object +
      polyfills.array
    )
    return shim + compiled + polyfills.pico8Lifecycle
  }
}

const polyfills = {
/**/
  pico8Lifecycle: `

-- pico-8 lifecycle functions
_init = function(...)
  print(type(__init))
  if __init then
    __init(...)
  end
end
_update = function(...)
  if __update then
    __update(...)
  end
end
_draw = function(...)
  if __draw then
    __draw(...)
  end
end
`,
/**/
 typeCoercions: `

-- type coercions
_tonum = function(x)
  return 0 + x
end
_tostr = function(x)
  return '' .. x
end
_eq = function(x, y)
  return x == y
end
_add = function(x, y)
  -- coercing objects (mostly arrays) to string
  if (type(x) == 'table' or type(y) == 'table') and (type(x) == 'string' or type(y) == 'string') then
    local _x, _y = x, y
    if (type(_x) == 'table') then
      _x = _x:tostring()
    end
    if (type(_y) == 'table') then
      _y = _y:tostring()
    end
    return x .. y
  end
  -- concatenation
  if type(x) == 'string' or type(y) == 'string' then
    return _tostr(x) .. y
  -- addition
  else
    return x + y
  end
end
_addstr1 = _add
_addstr2 = _add
_addnum1 = _add
_addnum2 = _add
_bool = function(x)
  if x == 0 or x == '' or x == nil or x ~= x then
    return false
  else
    return x
  end
end
_inc = function(x)
  return x + 1
end
_dec = function(x)
  return x - 1
end
_mod = function(x, y)
  return x % y
end
_lt = function(x, y)
  return x < y
end
_le = function(x, y)
  return x <= y
end
_gt = function(x, y)
  return x > y
end
_ge = function(x, y)
  return x >= y
end
`,
/**/
  bitwiseOperations: `

-- bitwise operations
_lshift = shl
_rshift = shr
-- _arshift = ???
_bor = bor
_bxor = bxor
_band = band
_bnot = bnot
`,
/**/
  globalFunctions: `

-- global functions
isnan = function(x)
  return x ~= x
end
isfinite = function(x)
  return x ~= infinity and x ~= -infinity and not (x ~= x)
end
`,
/**/
  globalObjects: `

-- global objects
infinity = 32767 -- highest number in pico-8
console = {
  log = function(_, ...) print(...) end;
  info = function(_, ...) print(...) end;
  warn = function(_, ...) print(...) end;
  error = function(_, ...) print(...) end;
  debug = function(_, ...) printh(...) end;
}
-- todo: falsey values
-- null = nil
-- nan = 0/0
-- undefined = nil
`,
/**/
  keywords: `

-- keywords
_new = function (f, prototype, ...)
  if type(f) ~= 'function' then
    _throw(type(f) .. ' is not a function')
  end
  local o = {}
  for k,v in pairs(prototype) do
    o[k] = v
  end
  local ret = f(o, ...)
  local tr = type(ret)
  if tr == 'table' or tr == 'function' then
    return ret
  end
  return o
end

-- arguments keyword
_args = function (...)
  local args = {...}
  local obj = {}
  -- make a 0 based numbering array like
  -- and we ignore the first argument (= this)
  for i = 2, #args do
    obj[i - 2] = args[i]
  end
  obj.length = #args - 1
  return obj
end

-- typeof keyword
_type = function(x)
  if x == nil then
    return 'undefined'
  end
  local tx = type(x)
  if tx == 'table' then
    return 'object'
  end
  return tx
end

_in = function(x, k)
  return x[k] ~= nil
end

_void = function() end

_throw = function(err)
  local _err = err or 'Uncaught Error'
  print(_err)
  printh(_err)
  trace()
  stop()
end
`,
/**/
  object: `

_obj = function(...)
 return object_prototype.constructor(...)
end

object = {
  assign=function(_, x, ...)
    if not x then
      _throw('Uncaught TypeError: Cannot convert undefined or null to object')
    end
    for k,v in all({...}) do
      x[k] = v
    end
    return x
  end;
  keys=function(_, x)
    local ret = {}
    for k,v in pairs(x) do
      add(ret, k)
    end
    return ret
  end;
}

object_prototype = {
  constructor=function(x)
    return x
  end;
}

`,
/**/
  array: `

_arr = function(...)
  return array_prototype.constructor(...)
end

array = {}

array_prototype = {
  length = 0;
  constructor=function(x, count)
    x.length = length
    for k,v in pairs(array_prototype) do
      x[k] = v
    end
    return x
  end;
  tostring=function(this)
    return this:join(this)
  end;
  push=function(this, ...)
    local args = {...}
    for i = 1, #args do
      add(this, args[i])
      this.length += 1
    end
    return this.length
  end;
  pop=function(this)
    if this.length == 0 then
      return nil
    end
    local v = this[this.length - 1]
    del(this, v)
    return v
  end;
  shift=function(this)
    if this.length > 0 then
      local v = this[0]
      del(this, v)
      return v
    end
    return nil
  end;
  unshift=function(this, ...)
    local args = {...}
    local xs = {}
    for i = 1, #args do
      add(xs, args[i])
    end
    for i = #args, #args + this.length - 1 do
      xs[i+1] = this[i - #args]
    end
    for i = 0, #xs - 1 do
      this[i] = xs[i]
    end
    this.length = #xs
    return nil
  end;
  splice=function(this, first, count, ...)
    local xs = {...}
    local l = this.length
    if first > l then
      first = l
    elseif first < 0 then
      first = (l + first >= 0) and l + first or 0
    end
    count = min(count or (length - first), length - first)
    -- delete xs and collect deleted xs
    local ret = {}
    for i = 1,count do
      ret[i - 1] = this[first]
      if first == 0 then
        local v = this[1] or nil
        this[0] = v
      else
        del(this, first)
      end
    end
    -- insert new xs
    for i = 1,#xs do
      if index == 0 then
        local v = this[0]
        this[1] = v
        this[0] = xs[i]
      else
        this[index] = xs[i]
      end
      index = index + 1
    end
    -- update length
    this.length = l - count + #xs
    -- return array of removed values
    return _arr(ret, count)
  end;
  reverse=function(this)
    local l = this.length
    for i = o, floor(l/2) - 1 do
      local v = this[i]
      this[i] = this[l - 1 - i]
      this[l - 1 - i] = v
    end
    return this
  end;
  slice=function(this, first, last)
    local l = this.length
    first = first or 0
    last = last or l
    if first < 0 then
      first = (l + first >= 0) and l + first or 0
    end
    if last < 0 then
      last = (l + last >= 0) and l + last or 0
    elseif last > l then
      last = length
    end
    local ret, count = {}, 0
    for i = first, last - 1 do
      ret[count] = this[i]
      count += 1
    end
    return _arr(ret, count)
  end;
  concat=function(this, ...)
    local ret = {}
    local l = this.length
    local args = {...}
    for i = 1, l do
      ret[i] = this[i - 1]
    end
    for i = 1, #args do
      if (args[i].constructor and args[i].constructor == array_prototype.constructor) then
        for j = 0, args[i].length - 1 do
          add(this, args[i][j])
          l = l + args[i].length
        end
      else
        add(this, args[i])
          l += 1
      end
    end
    local v = ret[1]
    del(ret, 1)
    this[0] = v
    return _arr(ret, l)
  end;
  sort=function(this, f)
    local ret, count low, hi = {}, this.length, 0, 0
    for i = 0, this.length - 2 do
      local a = this[i]
      local b = this[i + 1]
      local x = f(a, b)
      if x < 0 then
        -- sort a to lower index than b
        ret[i - 1], ret[i] = a, b
      elseif x > 0 then
        -- sort b to lower index than a
        ret[i - 1], ret[i] = b, a
      else
        -- leave at same index
        ret[i], ret[i + 1] = a, b
      end
    end
    local v = ret[1]
    del(ret, 1)
    this[0] = v
    return _arr(ret, count)
  end;
  join=function(this, delim)
    local ret = ''
    for i = 0, this.length - 1 do
      if this[i] then
        ret = _add(ret, this[i])
      end
      if i ~= this.length - 1 then
        ret = ret .. delim
      end
    end
    return ret
  end;
  lastindexof=function(this, x, first)
    local l = this.length
    local n = first or l - 1
    if n < 0 then
      n = l + n
    elseif n > l then
      n = l - 1
    end
    for i = n, 0, -1 do
      if this[i] == x then
        return i
      end
    end
    return -1
  end;
  indexof=function(this, x, first)
    local l = this.length
    local n = first or l - 1
    if n >= l then
      return -1
    end
    if n < 0 then
      n = (l + n >= 0) and l + n or 0
    end
    for i = n, l - 1 do
      if this[i] == x then
        return i
      end
    end
    return -1
  end;
  map=function(this, f, ctx)
    local ret, count = {}, 0
    for i = 0, this.length - 1 do
      if this[i] then
        local v = f(ctx, this[i], i, this)
        add(ret, v)
      end
    end
    local v = ret[1]
    del(ret,1)
    this[0] = v
    return _arr(ret, count)
  end;
  filter=function(this, f, ctx)
    local ret, count = {}, 0
    for i = 0, this.length - 1 do
      if this[i] and _bool(f(ctx, this[i], i, this)) then
        add(ret, this[i])
        count += 1
      end
    end
    local v = ret[1]
    del(ret,1)
    this[0] = v
    return _arr(ret, count)
  end;
  reduce=function(this, f, init)
    if this.length == 0 and init == nil then
      _throw('Reduce of empty array with no initial value')
    end
    local ret, count = init or this[0], 0
    for i = 0, this.length - 1 do
      if this[i] then
        ret = f(nil, ret, this[i], i, this)
      end
    end
    return ret
  end;
  reduceright=function(this, f, init)
    if this.length == 0 and init == nil then
      _throw('Reduce of empty array with no initial value')
    end
    local ret, count = init or this[this.length - 1], 0
    local first = this.length - 1
    for i = start, 0, - 1 do
      if this[i] then
        ret = f(nil, ret, this[i], i, this)
      end
    end
    return ret
  end;
  foreach=function(this, f, ctx)
    for i = 0, this.length - 1 do
      if this[i] then
        f(ctx, this[i], i, this)
      end
    end
  end;
  some=function(this, f, ctx)
    for i = 0, this.length - 1 do
      if this[i] and _bool(f(ctx, this[i], i, this)) then
        return true
      end
    end
    return false
  end;
  every=function(this, f, ctx)
    for i = 0, this.length - 1 do
      if not _bool(f(ctx, this[i], i, this)) then
        return false
      end
    end
    return true
  end;
}
`
}



