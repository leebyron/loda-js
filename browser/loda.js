/* global module, define, loda: true */

function universalModule(module) { module = module || {}
  
/* global Symbol */

/**
 * Use JavaScript functionally, you must!
 */

var loda;

function install(global) {
  for (var x in loda) {
    if (loda[x] !== install) {
      if (global[x] && global[x] !== loda[x]) {
        throw new Error(x + ' already in scope');
      }
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
  length < 0 && (length = 0);
  return length === fn.length ? fn : getArityFn(length)(fn);
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

function call(fn, maybeFunctor) {
  if (arguments.length === 2 &&
      maybeFunctor &&
      typeof maybeFunctor.map === 'function') {
    return maybeFunctor.map(fn);
  }
  var $_arguments = new Array(arguments.length - 1); for (var $_i = 1; $_i < arguments.length; ++$_i) $_arguments[$_i - 1] = arguments[$_i];
  return fn.apply(this, $_arguments);
}


/**
 * Apply
 */

function apply(fn, argArray, thisArg) {
  return fn.apply(thisArg || this, argArray);
}



/**
 * Curry
 */

function curry(fn, arity) {
  arity = arity || fn.length;
  return arity > 1 ?
    getCurryFn(arity)(getCurryFn, CURRY_SYMBOL, uncurry(fn)) :
    fn;
}

curry.right = curryRight;

function curryRight(fn, arity) {
  arity = arity || fn.length;
  return arity > 1 ?
    getCurryRightFn(arity)(getCurryRightFn, CURRY_SYMBOL, uncurry(fn)) :
    fn;
}

function isCurried(fn) {
  return !!fn[CURRY_SYMBOL];
}

function uncurry(fn) {
  return isCurried(fn) ? fn[CURRY_SYMBOL] : fn;
}

// Internal

var CURRY_SYMBOL = typeof Symbol === 'function' ? Symbol() : '@__curried__@';
var CURRY_CACHE = [];
var CURRY_RIGHT_CACHE = [];

function getCurryFn(arity) {
  return CURRY_CACHE[arity] || (CURRY_CACHE[arity] = makeCurryFn(arity));
}

function getCurryRightFn(arity) {
  return CURRY_RIGHT_CACHE[arity] || (CURRY_RIGHT_CACHE[arity] = makeCurryRightFn(arity));
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
    '  curried[curriedSymbol] = fn;\n'+
    '  return curried;'
  );
}

function makeCurryRightFn(arity) {
  var cases = '';
  var curriedArgs = ['_0'];
  for (var ii = 1; ii < arity; ii++) {
    cases +=
      '      case ' + ii + ': return getCurryFn(' + (arity - ii) + ')(getCurryFn, curriedSymbol, function() {\n'+
      '        var args = ['+curriedArgs.join(',')+'];\n'+
      '        for (var i = arguments.length - 1; i >= 0; i--) args.unshift(arguments[i]);\n'+
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
    '  curried[curriedSymbol] = fn;\n'+
    '  return curried;'
  );
}



/**
 * Composition
 */

function compose() {
  var fns = arguments;
  var numFns = fns.length;
  if (numFns < 2) {
    return numFns ? fns[0] : id;
  }
  var firstFn = fns[numFns - 1];
  return arity(firstFn.length, function composedFn() {
    var result = firstFn.apply(this, arguments);
    var ii = numFns - 1;
    while (ii--) {
      result = fns[ii].call(this, result);
    }
    return result;
  });
}

compose.right = composeRight;

function composeRight() {
  return compose.apply(this, Array.prototype.reverse.call(arguments));
}



/**
 * Partial
 */

function partial(fn) {
  if (arguments.length === 1) return fn;
  var partialArgs = selectArgs(arguments, 1);
  return arity(fn.length - partialArgs.length, function partialFn() {
    return fn.apply(this, concat(partialArgs, arguments));
  });
}

partial.right = partialRight;

function partialRight(fn) {
  if (arguments.length === 1) return fn;
  var partialArgs = selectArgs(arguments, 1);
  return arity(fn.length - partialArgs.length, function partialFn() {
    return fn.apply(this, concat(arguments, partialArgs));
  })
}



/**
 * Unbinding
 */

/**
 * `decontextify` returns a new function with an additional argument which will
 * be provided to the original fn as its `this` context. This is particularly
 * useful for wrapping prototype methods of built-ins. Example:
 *
 *     var slice = decontextify(Array.prototype.slice);
 *     slice(2, [ 1, 2, 3, 4 ])      // [ 3, 4 ]
 *     slice(1, -1, [ 1, 2, 3, 4 ])  // [ 2, 3 ]
 *
 * This is similar to `partial(call, myFn)`, but will return a function with an
 * arity based on the provided function.
 */
function decontextify(fn) {
  return arity(fn.length + 1, function (thisArg) {
    var $_thisArg = arguments[arguments.length - 1];
    var $_arguments = new Array(arguments.length - 1); for (var $_i = 0; $_i < arguments.length - 1; ++$_i) $_arguments[$_i] = arguments[$_i];
    return fn.apply($_thisArg, $_arguments);
  });
}

/**
 * The opposite of `decontextify`, `contextify` will provide the `this` context
 * it is called with as the last argument to the original function.
 */
function contextify(fn) {
  return arity(fn.length - 1, function () {
    var $_arguments = new Array(arguments.length + 1); for (var $_i = 0; $_i < arguments.length; ++$_i) $_arguments[$_i] = arguments[$_i];
    $_arguments[$_i] = this;
    return fn.apply(null, $_arguments);
  });
}


/**
 * Complement
 */

function complement(fn) {
  return arity(fn.length, function complementFn() {
    return !fn.apply(this, arguments);
  });
}

/**
 * Returns the same function with the arguments in the reverse order
 *
 *     function ab(a, b) { return a + ' ' + b }
 *     ba = flip(AB)
 *     ba('hello', 'you')  // 'you hello'
 *
 */
function flip(fn) {
  // TODO: should flip the curried function if curried.
  return arity(fn.length, function flippedFn() {
    return fn.apply(this, Array.prototype.reverse.apply(arguments));
  });
}

/**
 * Takes a set of functions and returns a function which represents their
 * juxtaposition. When called, the juxtaposed function will return the result
 * of the arguments applied to each function as an array.
 *
 *     var example = knit(add(1), sub(1))
 *     example(10)  // [11, 9]
 *
 * `juxt` can be useful in conjunction with `map` for converting an array into
 * an object.
 *
 *     map(juxt(get('uid'), id), [ { uid: 'abc' }, { uid: 'xyz' } ])
 *     // { abc: { uid: 'abc' }, xyz: { uid: 'xyz' } }
 *
 */
function juxt(/* ... */) {
  var fns = arguments;
  var numFns = fns.length;
  return arity(fns[0].length, function() {
    var result = new Array(numFns);
    for (var ii = 0; ii < numFns; ii++) {
      result[ii] = fns[ii].apply(null, arguments);
    }
    return result;
  });
}

/**
 * Returns a function which when called will apply each provided argument to the
 * corresponding function provided to knit. Example:
 *
 *     var example = knit(add(1), sub(1))
 *     example([10, 20])  // [11, 19]
 *
 * `knit` can be useful when mapping over key-value pairs such as objects.
 * .
 *
 *    map(knit(id, neg), { a: 1, b: 2, c: 3 }) // { a: -1, b: -2, c: -3 }
 *
 * Equivalent to:
 *
 *     compose(partial(compose, array), partial(partial, map, call), tuple)
 *
 */
function knit(/* ... */) {
  var fns = arguments;
  return function(tuple) {
    var result = new Array(fns.length);
    for (var ii = 0; ii < fns.length; ii++) {
      result[ii] = fns[ii](tuple[ii]);
    }
    return result;
  };
}



/**
 * Memoization
 * -----------
 */


/**
 * Memo
 */
function memo(fn) {
  if (isMemoized(fn)) {
    return fn;
  }
  var wasCurried = isCurried(fn);
  wasCurried && (fn = uncurry(fn));
  var memoized = function () {
    var arg = reduce(argCache, memoized[MEMO_CACHE_SYMBOL], arguments);
    return arg.hasOwnProperty(MEMO_CACHE_SYMBOL) ?
      arg[MEMO_CACHE_SYMBOL] :
      (arg[MEMO_CACHE_SYMBOL] = fn.apply(this, arguments));
  }
  memoized = wasCurried ?
    curry(memoized, fn.length) :
    arity(fn.length, memoized);
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
 * Iterable
 * --------
 */

function _iterator(maybeIterable) {
  var iterable;
  return maybeIterable && typeof maybeIterable.next === 'function' ?
    maybeIterable :
    (iterable = _iterable(maybeIterable)) &&
    (iterable[ITERATOR_SYMBOL] ?
      iterable[ITERATOR_SYMBOL]() :
      iterable[ALT_ITERATOR_SYMBOL]());
}

function _iterable(maybeIterable) {
  if (!maybeIterable) {
    return EMPTY_ITERABLE;
  }
  if (maybeIterable[ITERATOR_SYMBOL] ||
      maybeIterable[ALT_ITERATOR_SYMBOL]) {
    return maybeIterable;
  }
  if (typeof maybeIterable === 'function') {
    return new LodaIterable(maybeIterable);
  }
  if (maybeIterable.length === 0) {
    return EMPTY_ITERABLE;
  }
  if (maybeIterable.length > 0) {
    return new IndexedIterable(maybeIterable);// indexedIterable(maybeIterable);
  }
  return keyedIterable(maybeIterable);
}

// Internal iterator helpers

function isIterable(maybeIterable) {
  return !!(maybeIterable && (
    maybeIterable[ITERATOR_SYMBOL] ||
    maybeIterable[ALT_ITERATOR_SYMBOL] ||
    isArray(maybeIterable) ||
    typeof maybeIterable === 'string'
  ));
}

var ALT_ITERATOR_SYMBOL = '@@_iterator';
var ITERATOR_SYMBOL =
  typeof Symbol === 'function' ? Symbol._iterator : ALT_ITERATOR_SYMBOL;
var ITERATOR_DONE = { done: true, value: undefined };
var ITERATOR_VALUE = { done: false, value: undefined };

function LodaIterable(_iteratorFactory) {
  this._iteratorFactory = _iteratorFactory;
}
LodaIterable.prototype[ITERATOR_SYMBOL] = function() {
  var _iterator = this._iteratorFactory();
  return _iterator.next ? _iterator : new LodaIterator(_iterator);
}
LodaIterable.prototype.toString =
LodaIterable.prototype.toSource =
LodaIterable.prototype.inspect = function() {
  return '[Iterable]';
}
function LodaIterator(next) {
  this.next = next;
}

function IndexedIterable(indexed) {
  this.indexed = indexed;
}
IndexedIterable.prototype = new LodaIterable();
IndexedIterable.prototype[ITERATOR_SYMBOL] = function() {
  return new IndexedIterator(this.indexed);
}
function IndexedIterator(indexed) {
  this.indexed = indexed;
  this.index = 0;
}
IndexedIterator.prototype.next = function() {
  return this.index === this.indexed.length ?
    ITERATOR_DONE :
    _iteratorValue(this.indexed[this.index++]);
}


function keyedIterable(keyed) {
  return new LodaIterable(function() {
    var ii = 0;
    var keys = Object.keys(keyed); // TODO: replace this with for hasOwn
    return function () {
      if (ii === keys.length) {
        return ITERATOR_DONE;
      }
      return _iteratorValue([keys[ii], keyed[keys[ii++]]]);
    };
  });
}

var EMPTY_ITERABLE = new LodaIterable(function() {
  return EMPTY_ITERATOR;
});
var EMPTY_ITERATOR = new LodaIterator();
EMPTY_ITERATOR.next = function () {
  return ITERATOR_DONE;
}

function _iteratorValue(value) {
  ITERATOR_VALUE.value = value;
  return ITERATOR_VALUE;
}




/**
 * Reify Iterables
 * ---------------
 */

/**
 * If using ES6, prefer the spread operator. These two uses are equivalent, but
 * the latter is idiomatic ES6 JavaScript.
 *
 *    var mapped = map(add(1), [1,2,3])
 *    var arr1 = array(mapped)
 *    var arr2 = [...mapped]
 *
 */
function array(iterable) {
  return reduce(pushIn, [], iterable);
}

// Interal
function pushIn(array, val) {
  return array.push(val), array;
}

/**
 * Creates a JavaScript Object from a [ k, v ] tuple iterable.
 *
 * Example:
 *
 *     object([ [ 'a', 1 ], [ 'b', 2 ] ])  // { a: 1, b: 2 }
 *
 */
function object(iterable) {
  return reduce(setIn, {}, iterable);
}

// Interal
function setIn(indexed, kvTuple) {
  return (indexed[kvTuple[0]] = kvTuple[1]), indexed;
}

/**
 * Creates a string from an iterable by concatenating all yielded values
 * together.
 *
 * Example:
 *
 *     string([ 1, 2, 3 ])  // '123'
 *
 */
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
function doall(sideEffect, iterable) {
  var iter = _iterator(iterable);
  while (true) {
    var step = iter.next();
    if (step.done !== false) return;
    sideEffect(step.value);
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
  return (
    !iterable ||
    (iterable.length !== undefined && iterable.length === 0) ||
    _iterator(iterable).next().done
  );
}

/**
 * Count
 */
function count(iterable) {
  return iterable ?
    iterable.length === undefined ?
      reduce(increment, 0, iterable) :
      iterable.length :
    0;
}

function increment(x) {
  return x + 1;
}

/**
 * Take
 */
function take(num, iterable) {
  return new LodaIterable(function () {
    var iter = _iterator(iterable);
    var ii = 0;
    return function () {
      return ++ii > num ? ITERATOR_DONE : iter.next()
    }
  });
}

/**
 * Filter
 */
function filter(fn, iterable) {
  return new LodaIterable(function () {
    var iter = _iterator(iterable);
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
function map(fn, iterable) {
  var iterables = new Array(arguments.length - 1); for (var $_i = 1; $_i < arguments.length; ++$_i) iterables[$_i - 1] = arguments[$_i];
  return new LodaIterable(function () {
    var _iterators = selectArgs(iterables, 0, _iterator);
    var arity = _iterators.length;
    var argArray = new Array(arity);
    var step, ii;
    return function () {
      for (ii = 0; ii < arity; ii++) {
        step = _iterators[ii].next();
        if (step.done !== false) return step;
        argArray[ii] = step.value;
      }
      return _iteratorValue(fn.apply(null, argArray));
    }
  });
}


/**
 * Zip
 */
var zip = partial(map, tuple);

/**
 * Flatten
 */
function flatten(deepIterable) {
  return new LodaIterable(function () {
    var iter = _iterator(deepIterable);
    var stack = [];
    return function () {
      while (iter) {
        var step = iter.next();
        var value = step.value;
        if (step.done !== false) {
          iter = stack.pop();
        } else if (isIterable(value) && typeof value !== 'string') {
          stack.push(iter);
          iter = _iterator(value);
        } else {
          return step;
        }
      }
      return ITERATOR_DONE;
    }
  });
}

/**
 * Memoize Iterable
 */
function memoIterable(iterable) {
  var iter = _iterator(iterable);
  var cache = [];
  var cacheFilled;
  return new LodaIterable(function () {
    if (cacheFilled) {
      return _iterator(cache);
    }
    var ii = 0;
    return function () {
      if (ii++ < cache.length) {
        return _iteratorValue(cache[ii - 1]);
      }
      var step = iter.next();
      step.done ? (cacheFilled = true) : cache.push(step.value);
      return step;
    }
  });
}

/**
 * Join
 */
var join = curry(decontextify(Array.prototype.join));

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
function reduce(fn) {
  var reduced, iter;
  if (arguments.length === 3) {
    iter = _iterator(arguments[2]);
    reduced = arguments[1];
  } else {
    iter = _iterator(arguments[1]);
    reduced = iter.next().value;
  }
  while (true) {
    var step = iter.next();
    if (step.done !== false) return reduced;
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
  var iter;
  if (left) {
    iter = _iterator(left);
    left = iterable;
  } else {
    iter = _iterator(iterable);
    left = iter.next().value;
  }
  while (true) {
    var step = iter.next();
    if (step.done !== false) return true;
    if (!fn(left, step.value)) return false;
    left = step.value;
  }
}

/**
 * Every
 */
function every(fn) {
  return all(fn, selectArgs(arguments, 1, _iterator));
}

function some(fn) {
  return !all(complement(fn), selectArgs(arguments, 1, _iterator));
}

function all(fn, _iterators) {
  var arity = _iterators.length;
  while (true) {
    var argArray = new Array(arity);
    for (var ii = 0; ii < arity; ii++) {
      var step = _iterators[ii].next();
      if (step.done !== false) return true;
      argArray[ii] = step.value;
    }
    if (!fn.apply(null, argArray)) return false;
  }
}



/**
 * Argument computations
 * ---------------------
 */

/**
 * The identity function returns the first argument provided.
 */
function id(x) {
  return x
}

/**
 * Returns an Array of all arguments provided.
 */
function tuple(/* ... */) {
  return selectArgs(arguments);
}

/**
 * Holds the provided arguments, returning a function which, when called with
 * another function, will return the results of being supplied with the
 * original arguments. Example:
 *
 *     pipe(1, 2, 3)(add)  // 6
 *
 * If provided multiple functions, it will call each with the value returned
 * from the previous, similar to underscore's `chain`.
 *
 *     pipe(1, 2, 3)(add, mul(2), add(1))  // 13
 *
 */
function pipe() {
  var $_arguments = new Array(arguments.length); for (var $_i = 0; $_i < arguments.length; ++$_i) $_arguments[$_i] = arguments[$_i];
  return compose(partialRight(apply, $_arguments), composeRight);
}



/**
 * Indexed
 * -------
 */

var get = curry(function (key, indexed) {
  return indexed[key];
});



/**
 * Maths
 * -----
 */

var add = curry(argReducer(add2), 2);

var sub = curryRight(argReducer(function (x, y) {
  return x - y
}), 2);

var mul = curry(argReducer(function (x, y) {
  return x * y
}), 2);

var div = curryRight(argReducer(function (x, y) {
  return x / y
}), 2);

var mod = curryRight(argReducer(function (x, y) {
  return x % y
}), 2);

var pow = curryRight(argReducer(function (x, y) {
  return Math.pow(x, y)
}), 2);

var max = curry(argReducer(function (x, y) {
  return x > y ? x : y;
}), 2);

var min = curry(argReducer(function (x, y) {
  return x < y ? x : y;
}), 2);

function neg(x) {
  return -x;
}



/**
 * Comparators
 * -----------
 */

var eq = curry(argComparer(eq2), 2);

var lt = curryRight(argComparer(function (x, y) {
  return x < y;
}), 2);

var lteq = curryRight(argComparer(function (x, y) {
  return x <= y;
}), 2);

var gt = curryRight(argComparer(function (x, y) {
  return x > y;
}), 2);

var gteq = curryRight(argComparer(function (x, y) {
  return x >= y;
}), 2);


/**
 * Functors / Monads / Monoids
 */

// TODO: if value is just an iterator, use the list comprehension form.
function fmap(fn, functor) {
  if (isCurried(fn) && fn.length > 1 && functor.chain) {
    return fbind(function (value) {
      return fof(functor, curry(partial(uncurry(fn), value), fn.length - 1));
    }, functor);
  }
  if (functor.map) { // is Functor
    return functor.map(fn);
  }
  if (functor.ap) { // is Apply
    return fapply(fof(functor, fn), functor);
  }
  if (functor.chain && functor.of) { // is Monad
    return fbind(function (a) { return fof(functor, fn(a)); }, functor);
  }
  throw new Error('Value provided is not Functor: ' + functor);
}

// TODO: handle curried case
function fapply(appFn, appVal) {
  if (appFn.ap) { // is Apply
    return appFn.ap(appVal);
  } else if (appFn.chain) { // is Chain
    return fbind(function (fn) { return fmap(fn, appVal); }, appFn);
  }
  throw new Error('Value provided is not Apply: ' + appFn);
}

function fof(applicative, value) {
  if (applicative.of) { // is Applicative
    return applicative.of(value);
  }
  throw new Error('Value provided is not Applicative: ' + applicative);
}

function fbind(fn, monad) {
  if (monad.chain) { // is Chain
    return monad.chain(fn);
  }
  throw new Error('Value provided is not Monad: ' + monad);
}

function fpipe(monad) {
  return function(fn) {
    var result = monad;
    for (var ii = 0; ii < arguments.length; ii++) {
      result = fbind(arguments[ii], result);
    }
    return result;
  }
}




/**
 * Maybe
 */
function Maybe(value) {
  return value == null ?
    MaybeNone :
    value instanceof Maybe ?
      value :
      new MaybeValue(value);
}
Maybe.of = Maybe;
Maybe.prototype.of = Maybe;
Maybe.is = function (maybe) {
  return maybe.is();
};
Maybe.force = function (maybe) {
  return maybe.force();
};
Maybe.or = curry(function (fallback, maybe) {
  return maybe.or(fallback);
});

function MaybeValue(value) {
  if (this instanceof MaybeValue) {
    this._value = value;
  } else {
    return new MaybeValue(value);
  }
}
MaybeValue.prototype = Object.create(Maybe.prototype);
MaybeValue.prototype.toString =
MaybeValue.prototype.toSource =
MaybeValue.prototype.inspect = function() {
  return 'Maybe.Value ' + this._value;
}
MaybeValue.prototype.is = function() {
  return true;
}
MaybeValue.prototype.or = function(fallback) {
  return this._value;
}
MaybeValue.prototype.force = function() {
  return this._value;
}
MaybeValue.prototype.equals = function(maybe) {
  return maybe.is() && eq2(this._value, maybe._value);
}
MaybeValue.prototype.map = function(fn) {
  return this.of(fn(this._value));
}
MaybeValue.prototype.ap = function(maybe) {
  return maybe.map(this._value);
}
MaybeValue.prototype.chain = function(fn) {
  return fn(this._value);
}
MaybeValue.prototype[ITERATOR_SYMBOL] = function() {
  return new IndexedIterator([this._value]);
}
Maybe.Value = MaybeValue;

function MaybeNone() {
  return MaybeNone;
}
MaybeNone.prototype = Object.create(Maybe.prototype);
MaybeNone.prototype.toString =
MaybeNone.prototype.toSource =
MaybeNone.prototype.inspect = function() {
  return 'Maybe.None';
}
MaybeNone.prototype.is = function() {
  return false;
}
MaybeNone.prototype.or = function(fallback) {
  return fallback;
}
MaybeNone.prototype.force = function() {
  throw new Error('Cannot force a value from None.');
}
MaybeNone.prototype.equals = function(maybe) {
  return maybe === MaybeNone;
}
MaybeNone.prototype.map =
MaybeNone.prototype.ap =
MaybeNone.prototype.chain = function(fn) {
  return MaybeNone;
}
MaybeNone.prototype[ITERATOR_SYMBOL] = function() {
  return EMPTY_ITERATOR;
}
var setPrototypeOf = Object.setPrototypeOf || function (obj, proto) {
  obj.__proto__ = proto; // jshint ignore: line
  return obj;
}
setPrototypeOf(MaybeNone, MaybeNone.prototype);
Maybe.None = MaybeNone;



/**
 * Internal helper methods
 */

function add2(x, y) {
  return x + y;
}

function eq2(x, y) {
  return x === y || (x && x.equals && x.equals(y));
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

function argReducer(fn) {
  return function() {
    var reduced = arguments[0];
    for (var ii = 1; ii < arguments.length; ii++) {
      reduced = fn(reduced, arguments[ii]);
    }
    return reduced;
  }
}

function argComparer(fn) {
  return function() {
    var left = arguments[0];
    for (var ii = 1; ii < arguments.length; ii++) {
      var right = arguments[ii];
      if (!fn(left, right)) return false;
      left = right;
    }
    return true;
  }
}

var isArray = Array.isArray || function (maybeArray) {
  return maybeArray.constructor === Array;
}



/**
 * Export public API
 */
module.exports = loda = {
  'install': install,

  'arity': arity,
  'call': curry(call),
  'apply': curry(apply, 2),
  'curry': curry,
  'isCurried': isCurried,
  'compose': compose,
  'partial': partial,
  'decontextify': decontextify,
  'contextify': contextify,
  'complement': complement,
  'flip': flip,
  'juxt': juxt,
  'knit': knit,

  'memo': memo,
  'isMemoized': isMemoized,
  'clearMemo': clearMemo,

  'iterable': _iterable,
  'iterator': _iterator,
  'isIterable': isIterable,

  'array': array,
  'object': object,
  'string': string,
  'doall': curry(doall, 2),

  'isEmpty': isEmpty,
  'count': count,
  'take': curry(take, 2),
  'filter': curry(filter, 2),
  'map': curry(map, 2),
  'zip': curry(zip, 2),
  'flatten': flatten,
  'memoIterable': memoIterable,
  'join': join,
  'reduce': curry(reduce, 2),
  'reduced': reduced,
  'compare': curry(compare, 2),
  'every': curry(every, 2),
  'some': curry(some, 2),

  'id': id,
  'tuple': tuple,
  'pipe': pipe,

  'get': get,

  'add': add,
  'sub': sub,
  'mul': mul,
  'div': div,
  'mod': mod,
  'pow': pow,
  'max': max,
  'min': min,
  'neg': neg,

  'eq': eq,
  'lt': lt,
  'lteq': lteq,
  'gt': gt,
  'gteq': gteq,

  'fmap': curry(fmap),
  'fapply': curry(fapply),
  'fof': curry(fof),
  'fbind': curry(fbind),
  'fpipe': fpipe,

  'Maybe': Maybe,
}

return module.exports; }

typeof module === 'object' ? universalModule(module) :
  typeof define === 'function' && define.amd ? define(universalModule) :
    loda = universalModule();
