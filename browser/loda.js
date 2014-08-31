/* global exports, module, define, loda */

function defineModule(module) {
  /* global Symbol */

/**
 * Use JavaScript functionally, you must!
 */

function install(global) {
  for (var x in loda) {
    if (loda[x] !== install) {
      if (global[x]) throw new Error(x + ' already in scope');
      global[x] = loda[x];
    }
  }
}



/**
 * Function manipulation
 * ---------------------
 */


/**
 * Arity
 */

function arity(length, fn) {
  return getArityFn(length)(fn);
}

// Internal

var ARITY_CACHE = [];

function getArityFn(length) {
  return ARITY_CACHE[length] || (ARITY_CACHE[length] =
    new Function('fn', makeArityFn(length)) /* jshint ignore: line */
  );
}

function makeArityFn(length) {
  var arr = new Array(length), ii = 0;
  while (ii < length) {
    arr[ii] = '_' + ii++;
  }
  return 'return function('+arr.join(',')+'){\n  '+
    'return fn.apply(this, arguments);\n}';
}



/**
 * Call
 */

function call(fn /*, ... */) {
  var calledArgs = selectArgs(arguments, 1);
  var thisArg = calledArgs.pop();
  return fn.apply(thisArg, calledArgs);
}


/**
 * Apply
 */

function apply(fn, argArray, thisArg) {
  return fn.apply(thisArg, argArray);
}



/**
 * Curry
 */

function curry(fn, arity) {
  arity = arity || fn.length;
  return arity > 1 ? getCurryFn(arity)(getCurryFn, CURRY_SYMBOL, fn) : fn;
}

// Internal

var CURRY_SYMBOL = typeof Symbol === 'function' ? Symbol() : '@__curried__@';
var CURRY_CACHE = [];

function getCurryFn(arity) {
  return CURRY_CACHE[arity] || (CURRY_CACHE[arity] = makeCurryFn(arity));
}

function makeCurryFn(arity) {
  var cases = '';
  var curriedArgs = ['_0'];
  for (var ii = 1; ii < arity; ii++) {
    cases +=
      '      case ' + ii + ': return getCurryFn(' + (arity - ii) + ')(getCurryFn, curriedSymbol, function() {\n'+
      '        var args = ['+curriedArgs.join(',')+'];\n'+
      '        for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);\n'+
      '        return fn.apply(this, args);\n'+
      '      });\n';
    curriedArgs.push('_' + ii);
  }
  return new Function('getCurryFn', 'curriedSymbol', 'fn', /* jshint ignore: line */
    '  function curried('+curriedArgs.join(',')+') {\n'+
    '    switch (arguments.length) {\n'+
    '      case 0: return curried;\n'+
    cases +
    '    }\n'+
    '    return fn.apply(this, arguments);\n'+
    '  }\n'+
    '  curried[curriedSymbol] = true;\n'+
    '  return curried;'
  );
}

function isCurried(fn) {
  return !!fn[CURRY_SYMBOL];
}



/**
 * Composition
 */

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



/**
 * Partial
 */

function partial(fn) {
  if (arguments.length === 1) return fn;
  var partialArgs = selectArgs(arguments, 1);
  var remainingArity = fn.length - partialArgs.length;
  function partialFn() {
    return fn.apply(this, concat(partialArgs, arguments));
  }
  return remainingArity > 0 ? arity(remainingArity, partialFn) : partialFn;
}

function partialLeft(fn) {
  if (arguments.length === 1) return fn;
  var partialArgs = selectArgs(arguments, 1);
  var remainingArity = fn.length - partialArgs.length;
  function partialFn() {
    return fn.apply(this, concat(arguments, partialArgs));
  }
  return remainingArity > 0 ? arity(remainingArity, partialFn) : partialFn;
}



/**
 * Bound
 */

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


/**
 * Complement
 */

function complement(fn) {
  function complementFn() {
    return !fn.apply(this, arguments);
  }
  return fn.length ? arity(fn.length, complementFn) : complementFn;
}




/**
 * Memoization
 * -----------
 */


/**
 * Memo
 */
function memo(fn) {
  var memoized = function () {
    var arg = reduce(argCache, memoized[MEMO_CACHE_SYMBOL], arguments);
    return arg.hasOwnProperty(MEMO_CACHE_SYMBOL) ?
      arg[MEMO_CACHE_SYMBOL] :
      (arg[MEMO_CACHE_SYMBOL] = fn.apply(this, arguments));
  }
  memoized = isCurried(fn) ?
    curry(memoized, fn.length) :
    fn.length ?
      arity(fn.length, memoized) :
      memoized;
  memoized[MEMO_CACHE_SYMBOL] = {};
  return memoized;
}

var MEMO_CACHE_SYMBOL = typeof Symbol === 'function' ? Symbol() : '@__memocache__@';

function argCache(cache, arg) {
  return cache[arg] || (cache[arg] = {})
}

function isMemoized(fn) {
  return !!fn[MEMO_CACHE_SYMBOL];
}

/**
 * Clear memoized function's cache
 */
function clearMemo(memoized) {
  memoized && memoized[MEMO_CACHE_SYMBOL] && (memoized[MEMO_CACHE_SYMBOL] = {})
  return memoized;
}




/**
 * Iterators
 * ---------
 */


// TODO add support for mori-ish things.
function iterable(maybeIterable) {
  if (!maybeIterable) {
    return EMPTY_ITERABLE;
  }
  if (maybeIterable[ITERATOR_SYMBOL]) {
    return maybeIterable;
  }
  if (typeof maybeIterable.next === 'function') {
    return new LodaIterable(function() { return maybeIterable });
  }
  if (typeof maybeIterable === 'function') {
    return new LodaIterable(maybeIterable);
  }
  if (maybeIterable.length === 0) {
    return EMPTY_ITERABLE;
  }
  if (maybeIterable.length > 0) {
    return indexedIterable(maybeIterable);
  }
  return keyedIterable(maybeIterable);
}

function iterator(maybeIterable) {
  return typeof maybeIterable.next === 'function' ?
    maybeIterable :
    iterable(maybeIterable)[ITERATOR_SYMBOL]();
}

// Internal iterator helpers

var ITERATOR_SYMBOL = typeof Symbol === 'function' ?
  Symbol.iterator :
  '@@iterator';
var ITERATOR_DONE = { done: true, value: undefined };
var ITERATOR_VALUE = { done: false, value: undefined };

function LodaIterable(iteratorFactory) {
  this.iteratorFactory = iteratorFactory;
}
LodaIterable.prototype[ITERATOR_SYMBOL] = function() {
  var iterator = this.iteratorFactory();
  return typeof iterator.next === 'function' ? iterator : new LodaIterator(iterator);
}
LodaIterable.prototype.toString =
LodaIterable.prototype.toSource =
LodaIterable.prototype.inspect = function() {
  return '[Iterable]';
}

function LodaIterator(next) {
  this.next = next;
}
LodaIterator.prototype[ITERATOR_SYMBOL] = function() {
  return this
}

function indexedIterable(indexed) {
  return new LodaIterable(function() {
    var ii = 0;
    return function () {
      if (ii === indexed.length) {
        return ITERATOR_DONE;
      }
      return iteratorValue(indexed[ii++]);
    };
  });
}

function keyedIterable(keyed) {
  return new LodaIterable(function() {
    var ii = 0;
    var keys = Object.keys(keyed); // TODO: replace this with for hasOwn
    return function () {
      if (ii === keys.length) {
        return ITERATOR_DONE;
      }
      return iteratorValue([keys[ii], keyed[keys[ii++]]]);
    };
  });
}

var EMPTY_ITERABLE = new LodaIterable();
EMPTY_ITERABLE[ITERATOR_SYMBOL] = new LodaIterator();
EMPTY_ITERABLE[ITERATOR_SYMBOL].next = function () {
  return ITERATOR_DONE;
}

function iteratorValue(value) {
  ITERATOR_VALUE.value = value;
  return ITERATOR_VALUE;
}




/**
 * Reify Iterables
 * ---------------
 */

function array(iterable) {
  return reduce(append, [], iterable);
}

function object(iterable) {
  return reduce(set, {}, iterable);
}

var string = partial(reduce, add2, '');

/**
 * Much like Array's `forEach` or underscore's `each`, however the `sideEffect`
 * is optional.
 *
 * If you're using ES6 and are using an anonymous function, prefer the native
 * for-of loop instead. These two uses are equivalent, but the latter is
 * idiomatic ES6 JavaScript.
 *
 *    var mapped = map(add(1), [1,2,3])
 *    doall(mapped, x => console.log(x))
 *    for (x of mapped) console.log(x)
 *
 */
function doall(iterable, sideEffect) {
  var iter = iterator(iterable);
  while (true) {
    var step = iter.next();
    if (step.done) return;
    sideEffect && sideEffect(step.value);
  }
}




/**
 * LodaIterable computations
 * ---------------------
 */

/**
 * isEmpty
 */
function isEmpty(iterable) {
  return !iterable || iterable.length === 0 || iterator(iterable).next().done;
}

/**
 * Filter
 */
function filter(fn, iterable) {
  return new LodaIterable(function () {
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
 * Map
 */
function map(fn) {
  var iterables = arguments;
  return new LodaIterable(function () {
    var iterators = selectArgs(iterables, 1, iterator);
    var arity = iterators.length;
    return function () {
      var argArray = new Array(arity);
      for (var ii = 0; ii < arity; ii++) {
        var step = iterators[ii].next();
        if (step.done) return step;
        argArray[ii] = step.value;
      }
      return iteratorValue(fn.apply(null, argArray));
    }
  });
}

/**
 * Zip
 */
var zip = partial(map, tuple);

/**
 * Count
 */
function count(iterable) {
  return iterable ? iterable.length ? iterable.length : reduce(counter, 0, iterable) : 0;
}

function counter(_, x) {
  return x + 1;
}


/**
 * Reduce
 *
 * Usage: (reduce f coll)
 *        (reduce f val coll)
 * f should be a function of 2 arguments. If val is not supplied,
 * returns the result of applying f to the first 2 items in coll, then
 * applying f to that result and the 3rd item, etc. If coll contains no
 * items, f must accept no arguments as well, and reduce returns the
 * result of calling f with no arguments.  If coll has only 1 item, it
 * is returned and f is not called.  If val is supplied, returns the
 * result of applying f to val and the first item in coll, then
 * applying f to that result and the 2nd item, etc. If coll contains no
 * items, returns val and f is not called.
 */
function reduce(fn, iterable) {
  var reduced = arguments[2];
  var iter, step;
  if (reduced) {
    iter = iterator(reduced);
    reduced = iterable;
  } else {
    iter = iterator(iterable);
    reduced = iter.next().value;
  }
  while (true) {
    step = iter.next();
    if (step.done) return reduced;
    reduced = fn(reduced, step.value);
    if (reduced === REDUCED) return REDUCED.value;
  }
}

/**
 * Reduced
 */
function reduced(value) {
  REDUCED.value = value;
  return REDUCED;
}

var REDUCED = { value : undefined };


/**
 * Compare
 */
function compare(fn, iterable) {
  var left = arguments[2];
  var iter, step;
  if (left) {
    iter = iterator(left);
    left = iterable;
  } else {
    iter = iterator(iterable);
    left = iter.next().value;
  }
  while (true) {
    step = iter.next();
    if (step.done) return true;
    if (!fn(left, step.value)) return false;
    left = step.value;
  }
}




/**
 * Argument computations
 * ---------------------
 */

function tuple(/* ... */) {
  return selectArgs(arguments);
}

/**
 * Juxtaposition
 */
function juxt(/* ... */) {
  var fns = arguments;
  var juxtaposedArity = fns.length;
  return arity(juxtaposedArity, function() {
    var result = new Array(arity);
    for (var ii = 0; ii < arity; ii++) {
      result[ii] = fns[ii](arguments[ii]);
    }
    return result;
  });
}

/**
 * Reduce Args
 */
var reduceArgs = curry(function (fn /* ... */) {
  var reduced = arguments[1];
  var numArgs = arguments.length;
  var ii = 1;
  while (++ii < numArgs) {
    reduced = fn(reduced, arguments[ii]);
    if (reduced === REDUCED) return REDUCED.value;
  }
  return reduced;
}, 2);

var compareArgs = curry(function (fn /* ... */) {
  var left = arguments[1];
  var numArgs = arguments.length;
  var ii = 1;
  while (++ii < numArgs) {
    var right = arguments[ii];
    if (!fn(left, right)) return false;
    left = right;
  }
  return true;
}, 2);




/**
 * Array Helpers
 * -------------
 */

function get(key, indexed) {
  return indexed[key];
}

function set(indexed, kvTuple) {
  return (indexed[kvTuple[0]] = kvTuple[1]), indexed;
}

function append(array, val) {
  return array.push(val), array;
}




/**
 * Maths
 * -----
 */

// TODO: these should all take var-args and become reductions.
// curry(compose(partial(reduce, add), tuple), 2);


var add = curry(reduceArgs(add2), 2);

var sub = curry(reduceArgs(function (x, y) {
  return x - y
}), 2);

var mul = curry(reduceArgs(function (x, y) {
  return x * y
}), 2);

var div = curry(reduceArgs(function (x, y) {
  return x / y
}), 2);

var mod = curry(reduceArgs(function (x, y) {
  return x % y
}), 2);

var pow = curry(reduceArgs(function (x, y) {
  return Math.pow(x, y)
}), 2);

var max = curry(reduceArgs(function (x, y) {
  return x > y ? x : y;
}), 2);

var min = curry(reduceArgs(function (x, y) {
  return x < y ? x : y;
}), 2);




/**
 * Comparators
 * -----------
 */

var eq = curry(compareArgs(function (x, y) {
  return x && x.equals ? x.equals(y) : x === y;
}), 2);

var lt = curry(compareArgs(function (x, y) {
  return x < y;
}), 2);

var lteq = curry(compareArgs(function (x, y) {
  return x <= y;
}), 2);

var gt = curry(compareArgs(function (x, y) {
  return x > y;
}), 2);

var gteq = curry(compareArgs(function (x, y) {
  return x >= y;
}), 2);




/**
 * Internal helper methods
 */

function identity(x) {
  return x
}

function add2(x, y) {
  return x + y;
}

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

function selectArgs(argsObj, skip, mapper) {
  skip = skip || 0;
  var mapped = new Array(Math.max(0, argsObj.length - skip));
  for (var ii = skip; ii < argsObj.length; ii++) {
    mapped[ii - skip] = mapper ? mapper(argsObj[ii]) : argsObj[ii];
  }
  return mapped;
}




/**
 * Export public API
 */
var loda = {
  'install': install,

  'arity': arity,
  'call': call,
  'apply': curry(apply, 2),
  'curry': curry,
  'isCurried': isCurried,
  'compose': compose,
  'composeLeft': composeLeft,
  'partial': partial,
  'partialLeft': partialLeft,
  'bound': bound,
  'boundLeft': boundLeft,
  'complement': complement,

  'memo': memo,
  'isMemoized': isMemoized,
  'clearMemo': clearMemo,

  'iterable': iterable,
  'iterator': iterator,

  'array': array,
  'object': object,
  'string': string,
  'doall': doall,

  'isEmpty': isEmpty,
  'filter': curry(filter, 2),
  'map': curry(map, 2),
  'zip': curry(zip, 2),
  'count': count,
  'reduce': curry(reduce, 2),
  'reduced': reduced,
  'compare': curry(compare, 2),

  'tuple': tuple,
  'juxt': juxt,
  'reduceArgs': reduceArgs,
  'compareArgs': compareArgs,

  'get': get,
  'set': set,
  'append': append,

  'add': add,
  'sub': sub,
  'mul': mul,
  'div': div,
  'mod': mod,
  'pow': pow,
  'max': max,
  'min': min,

  'eq': eq,
  'lt': lt,
  'lteq': lteq,
  'gt': gt,
  'gteq': gteq,
}

module.exports = loda;
;
}

function getModule() {
  var module = {};
  defineModule(module);
  return module.exports;
}

'object' === typeof exports ?
  defineModule(module) :
  'function' === typeof define && define.amd ?
    define(getModule) :
    loda = getModule(); /* jshint ignore: line */
