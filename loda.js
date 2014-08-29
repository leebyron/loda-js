/*

Use JavaScript functionally, you must!

*/



function concat(indexed1, indexed2) {
  var len1 = indexed1.length;
  var result = new Array(len1 + indexed2.length);
  for (var ii = 0; ii < len1; ii++) {
    result[ii] = indexed1[ii];
  }
  for (; ii < result.length; ii++) {
    result[ii] = indexed2[ii - len1];
  }
  return result;
}


function argStr(len) {
  var arr = new Array(len), ii = 0;
  while (ii < len) {
    arr[ii] = '_' + ii++;
  }
  return arr.join(',');
}


var ARITY_CACHE = [];

function getArityFn(arity) {
  return ARITY_CACHE[arity] || (ARITY_CACHE[arity] =
    new Function('fn', makeArityFn(arity))
  );
}

function makeArityFn(arity) {
  return 'return function('+argStr(arity)+'){\n  '+
    'return fn.apply(this, arguments);\n}';
}

function arity(arity, fn) {
  return getArityFn(arity)(fn);
}




var CURRY_CACHE = [];

function getCurryFn(arity) {
  return CURRY_CACHE[arity] || (CURRY_CACHE[arity] =
    new Function('getCurryFn', 'fn', makeCurryFn(arity))
  );
}

function makeCurryFn(arity) {
  var cases = '';
  var args = ['_0'];
  for (var ii = 1; ii < arity; ii++) {
    cases +=
      '      case ' + ii + ': return getCurryFn(' + (arity - ii) + ')(getCurryFn, function() {\n'+
      '        var args = ['+args.join(',')+'];\n'+
      '        for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);\n'+
      '        return fn.apply(this, args);\n'+
      '      });\n';
    args.push('_' + ii);
  }
  return '  function curried('+args.join(',')+') {\n'+
    '    switch (arguments.length) {\n'+
    '      case 0: return curried;\n'+
    cases +
    '    }\n'+
    '    return fn.apply(this, arguments);\n'+
    '  }\n'+
    '  return curried;';
}

function curry(fn, arity) {
  arity = arity || fn.length;
  return arity > 1 ? getCurryFn(arity || fn.length)(getCurryFn, fn) : fn;
}


function partial(fn) {
  var partialArgs = args(arguments, 1);
  var remainingArity = fn.length - args.length;
  function partialFn() {
    return fn.apply(this, concat(partialArgs, arguments));
  }
  return remainingArity > 0 ? arity(remainingArity, partialFn) : partialFn;
}

function partialLeft(fn) {
  var partialArgs = args(arguments, 1);
  var remainingArity = fn.length - args.length;
  function partialFn() {
    return fn.apply(this, concat(arguments, partialArgs));
  }
  return remainingArity > 0 ? arity(remainingArity, partialFn) : partialFn;
}





var ITERATOR_SYMBOL = typeof Symbol === 'function' ? Symbol.iterator : '@@iterator';

// TODO add support for mori-ish things.
function iterable(maybeIterable) {
  if (!maybeIterable || maybeIterable.length === 0) {
    return EMPTY_ITERABLE;
  }
  if (maybeIterable[ITERATOR_SYMBOL]) {
    return maybeIterable;
  }
  if (typeof maybeIterable.next === 'function') {
    return new Iterable(function() { return maybeIterable });
  }
  if (maybeIterable.length > 0) {
    return indexedIterable(maybeIterable);
  }
  return keyedIterable(maybeIterable);
}

function iterator(maybeIterable) {
  return iterable(maybeIterable)[ITERATOR_SYMBOL]();
}

function indexedIterable(indexed) {
  return new Iterable(function() {
    var ii = 0;
    return function () {
      if (ii === indexed.length) {
        return iteratorDone();
      }
      return iteratorValue(indexed[ii++]);
    };
  });
}

function keyedIterable(keyed) {
  return new Iterable(function() {
    var ii = 0;
    var keys = Object.keys(keyed);
    return function () {
      if (ii === keys.length) {
        return iteratorDone();
      }
      return iteratorValue([keys[ii], keyed[keys[ii++]]]);
    };
  });
}

function Iterable(iteratorFactory) {
  this.iteratorFactory = iteratorFactory;
}
Iterable.prototype[ITERATOR_SYMBOL] = function() {
  return new Iterator(this.iteratorFactory());
}
Iterable.prototype.toString =
Iterable.prototype.toSource =
Iterable.prototype.inspect = function() {
  return '[Iterable]';
}

function Iterator(next) {
  this.next = next;
}
Iterator.prototype[ITERATOR_SYMBOL] = function() {
  return this
}

var EMPTY_ITERABLE = new Iterable(function() {
  return iteratorDone
});


var ITERATOR_RETURN = { done: true, value: undefined };

function iteratorDone() {
  ITERATOR_RETURN.done = true;
  ITERATOR_RETURN.value = undefined;
  return ITERATOR_RETURN;
}

function iteratorValue(value) {
  ITERATOR_RETURN.done = false;
  ITERATOR_RETURN.value = value;
  return ITERATOR_RETURN;
}


function args(args, skip, mapper) {
  skip = skip || 0;
  var mapped = new Array(Math.max(0, args.length - skip));
  for (var ii = skip; ii < args.length; ii++) {
    mapped[ii - skip] = mapper ? mapper(args[ii]) : args[ii];
  }
  return mapped;
}

function filter(fn, iterable) {
  return new Iterable(function () {
    var iter = iterator(iterable);
    return function () {
      while (true) {
        var step = iter.next();
        if (step.done || fn(step.value)) return step;
      }
    }
  })
}

/**
 * Usage: (reduce f coll)
       (reduce f val coll)
f should be a function of 2 arguments. If val is not supplied,
returns the result of applying f to the first 2 items in coll, then
applying f to that result and the 3rd item, etc. If coll contains no
items, f must accept no arguments as well, and reduce returns the
result of calling f with no arguments.  If coll has only 1 item, it
is returned and f is not called.  If val is supplied, returns the
result of applying f to val and the first item in coll, then
applying f to that result and the 2nd item, etc. If coll contains no
items, returns val and f is not called.
 */
function reduce(fn, iterable) {
  var reduced = arguments[2];
  var iter, step;
  if (reduced) {
    iter = iterator(reduced);
    reduced = iterable;
  } else {
    iter = iterator(iterable);
    step = iter.next();
    if (step.done) return reduced;
    reduced = step.value;
  }
  while (true) {
    step = iter.next();
    if (step.done) return reduced;
    reduced = fn(reduced, step.value);
    if (reduced === REDUCED) return REDUCED.value;
  }
}

var REDUCED = { value : undefined };

function reduced(value) {
  REDUCED.value = value;
  return REDUCED;
}


function map(fn) {
  var iterables = arguments;
  return new Iterable(function () {
    var iterators = args(iterables, 1, iterator);
    var arity = iterators.length;
    return function () {
      var args = new Array(arity);
      for (var ii = 0; ii < arity; ii++) {
        var step = iterators[ii].next();
        if (step.done) return step;
        args[ii] = step.value;
      }
      return iteratorValue(fn.apply(null, args));
    }
  });
}




function varargs() {
  return args(arguments);
}

var zip = partial(map, varargs);



function identity(x) { return x }


function compose() {
  var fns = arguments;
  var numFns = fns.length;
  if (numFns < 2) {
    return numFns ? fns[0] : identity;
  }
  var firstFn = fns[numFns - 1];
  var composedArity = firstFn.length;
  function composedFn() {
    var result = firstFn.apply(this, arguments);
    var ii = numFns - 1;
    while (ii--) {
      result = fns[ii].call(this, result);
    }
    return result;
  }
  return composedArity ? arity(composedArity, composedFn) : composedFn;
}

function composeLeft() {
  return compose(Array.prototype.reverse.apply(arguments));
}


function argCache(arg, cache) {
  return cache[arg] || (cache[arg] = {})
}

var CACHE_SYMBOL = typeof Symbol === 'function' ? Symbol() : '@__memocache__@';

function memo(fn) {
  function memoized() {
    var arg = reduce(argCache, memoized[CACHE_SYMBOL], arguments);
    return arg[CACHE_SYMBOL] || (arg[CACHE_SYMBOL] = fn.apply(this, arguments));
  }
  fn.length && (memoized = arity(fn.length, memoized));
  memoized[CACHE_SYMBOL] = {};
  return memoized;
}

function clear(memoized) {
  memoized && memoized[CACHE_SYMBOL] && (memoized[CACHE_SYMBOL] = {})
  return memoized;
}

function bound(fn) {
  return arity(fn.length + 1, function () {
    // TODO: jsperf this.
    var thisArg = Array.prototype.pop.call(arguments);
    return fn.apply(thisArg, arguments);
  });
}

function boundLeft(fn) {
  return arity(fn.length + 1, function () {
    var thisArg = Array.prototype.shift.call(arguments);
    return fn.apply(thisArg, arguments);
  });
}

function call(fn, /* ... */ args) {
  var calledArgs = args(arguments, 1);
  var thisArg = calledArgs.pop();
  return fn.apply(thisArg, calledArgs);
}

function apply(fn, args/*, thisArg*/) {
  return fn.apply(arguments[2], args);
}


function complement(fn) {
  function complementFn() {
    return !fn.apply(this, arguments);
  }
  return fn.length ? arity(fn.length, complementFn) : complementFn;
}


function isEmpty(iterable) {
  return !iterable || iterable.length === 0 || iterator(iterable).next().done;
}

function count(iterable) {
  return iterable ? iterable.length ? iterable.length : reduce(counter, 0, iterable) : 0;
}

function counter(_, x) {
  return x + 1;
}


function get(key, indexed) {
  return indexed[key];
}

function set(indexed, tuple) {
  return (indexed[tuple[0]] = tuple[1]), indexed;
}

function append(array, val) {
  return array.push(val), array;
}



// TODO: these should all take var-args and become reductions.
// curry(compose(partial(reduce, add), varargs), 2);


function reduceArgs(fn) {
  var reduced = arguments[1];
  var numArgs = arguments.length;
  var ii = 1;
  while (++ii < numArgs) {
    reduced = fn(reduced, arguments[ii]);
    if (reduced === REDUCED) return REDUCED.value;
  }
  return reduced;
}

function add2(x, y) {
  return x + y;
}

var add = partial(reduceArgs, add2);



var sub = curry(function (y, x) {
  return x - y
});

var mul = curry(function (y, x) {
  return x * y
});

var div = curry(function (y, x) {
  return x / y
});

var mod = curry(function (y, x) {
  return x % y
});

var pow = curry(function (y, x) {
  return Math.pow(x, y)
});

var max = curry(function (y, x) {
  return Math.max.apply(null, arguments)
});

var min = curry(function (y, x) {
  return Math.min.apply(null, arguments)
});

// TODO
// is, lt, lteq, gt, gteq

function is(x, y) {
  return x && x.equals ? x.equals(y) : Object.is ? Object.is(x, y) : x === y;
}


var string = partial(reduce, add2, '');

function array(iterable) {
  return reduce(append, [], iterable);
}

function object(iterable) {
  return reduce(set, {}, iterable);
}


function install(global) {
  for (var x in loda) {
    if (loda[x] !== install) {
      if (global[x]) throw new Error(x + ' already in scope');
      global[x] = loda[x];
    }
  }
}


var loda = {
  install: install,

  iterator: iterator,
  array: array,
  object: object,
  string: string,

  arity: arity,
  bound: bound,
  boundLeft: boundLeft,
  call: call,
  apply: apply,
  curry: curry,
  partial: partial,
  partialLeft: partialLeft,
  compose: compose,
  composeLeft: composeLeft,

  complement: complement,

  memo: memo,
  clear: clear,

  varargs: varargs,

  map: curry(map, 2),
  zip: curry(zip, 2),
  filter: curry(filter, 2),
  count: count,
  reduce: curry(reduce, 2),
  reduced: reduced,


  identity: identity,
  isEmpty: isEmpty,

  add: curry(add, 2),
  sub: sub,
  mul: mul,
  div: div,
  mod: mod,
  pow: pow,
  max: max,
  min: min,

  is: curry(is)
};

module.exports = loda;

