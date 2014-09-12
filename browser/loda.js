function universalModule(module, undefined) { module = module || {}
  
/* global Symbol */

/**
 * Use JavaScript functionally, you must!
 */

//import "loda-core"

/* global arity, compose, composeRight, partial, partialRight,
          curry, curryRight, uncurry, isCurried,
          lift, ap, unit, chain, is */



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
 * Apply
 */
// TODO: test that iterable can be used as an argList
function apply(fn, argList, thisArg) {
  if (!isArray(argList)) {
    if (!isIterable(argList)) {
      throw new TypeError('Invalid argument list ' + argList);
    }
    argList = array(argList);
  }
  if (typeof fn === 'function') {
    return fn.apply(thisArg || this, argList);
  }
  if (isIterable(fn)) {
    return array(ap(fn, argList));
  }
  throw new TypeError('Invalid function: ' + fn);
}




/**
 * Unchaining
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
 * juxt(add(1), add(2))(10) is equivalent to apply([add(1), add(2)], [10])
 */
// ...Array<(x: T): S> -> T -> S[]
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

// ...Array<(x: T): Monad<S>> -> T -> Monad<S[]>
function juxtM(/* ... */) {
  var fns = new Array(arguments.length); for (var $_i = 0; $_i < arguments.length; ++$_i) fns[$_i] = arguments[$_i];
  return function(/* ... */) {
    var args = new Array(arguments.length); for (var $_i = 0; $_i < arguments.length; ++$_i) args[$_i] = arguments[$_i];
    return applyJuxtM(fns, args, 0, null);
  }
}

function applyJuxtM(fns, args, index, monadType) {
  if (index >= fns.length) {
    return unit(monadType, []);
  }
  var fn = fns[index];
  var resultMonad = fn.apply(null, args);
  return chain(function (result) {
    return lift(function (list) {
      return list.length ? [result].concat(list) : [result];
    }, applyJuxtM(fns, args, index + 1, resultMonad));
  }, resultMonad);
}


/**
 * Returns a function which when called will apply each provided argument to the
 * corresponding function provided to knit. Example:
 *
 *     var example = knit(add(1), sub(1))
 *     example([10, 20])  // [11, 19]
 *
 * `knit` can be useful when mapping over key-value pairs such as objects.
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
  if (maybeIterable.constructor === Object) {
    return keyedIterable(maybeIterable);
  }
  throw new Error('Not iterable: ' + maybeIterable);
}

// Internal iterator helpers

function isIterable(maybeIterable) {
  return !!(maybeIterable && typeof maybeIterable !== 'string' && (
    maybeIterable[ITERATOR_SYMBOL] ||
    maybeIterable[ALT_ITERATOR_SYMBOL] ||
    isArray(maybeIterable)
  ));
}

var ALT_ITERATOR_SYMBOL = '@@_iterator';
var ITERATOR_SYMBOL =
  typeof Symbol === 'function' ? Symbol.iterator : ALT_ITERATOR_SYMBOL;
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

function index(iterable) {
  return new LodaIterable(function() {
    var ii = 0;
    var iter = _iterator(iterable);
    return function () {
      var step = iter.next();
      if (step.done !== false) return ITERATOR_DONE;
      return _iteratorValue([ii++, step.value]);
    };
  });
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

function mapVal(fn, iterable) {
  return map(knit(id, fn), iterable)
}

/**
 * Zip
 */
var zip = partial(map, tuple);
var unzip = compose(partial(apply, zip), _iterable);

/**
 * Concat
 */
function concat(listOfLists) {
  // TODO: write tests for this method
  return new LodaIterable(function () {
    var iter = _iterator(listOfLists);
    var stack = [];
    return function () {
      while (iter) {
        var step = iter.next();
        if (step.done !== false) {
          iter = stack.pop();
        } else if (!stack.length) {
          var value = step.value;
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

var mapCat = curry(compose(concat, map));


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
        } else if (isIterable(value)) {
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

/*

TODO: infinite iterables?

Infinite lists
iterate :: (a -> a) -> a -> [a] Source

iterate f x returns an infinite list of repeated applications of f to x:

iterate f x == [x, f x, f (f x), ...]
repeat :: a -> [a] Source

repeat x is an infinite list, with x the value of every element.

replicate :: Int -> a -> [a] Source

replicate n x is a list of length n with x the value of every element. It is an instance of the more general genericReplicate, in which n may be of any integral type.

cycle :: [a] -> [a] Source

cycle ties a finite list into a circular one, or equivalently, the infinite repetition of the original list. It is the identity on infinite lists.



*/



/**
 * Memoize Iterable
 */
// TODO: test idempotence
function memoIterable(iterable) {
  if (iterable instanceof MemoIterable) {
    return iterable;
  }
  var iter = _iterator(iterable);
  var cache = [];
  var cacheFilled;
  return new MemoIterable(function () {
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

function MemoIterable(_iteratorFactory) {
  LodaIterable.call(this, _iteratorFactory);
}
MemoIterable.prototype = Object.create(LodaIterable.prototype);

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
// TODO: make this a function and have Maybe.None and Maybe.Error return true.
function reduced(value) {
  REDUCED.value = value;
  return REDUCED;
}

var REDUCED = { value : undefined };


// TODO: mapAccumL :: (acc -> x -> (acc, y)) -> acc -> [x] -> (acc, [y])
function accumulate(fn, value, iterable) {
  var iter = _iterator(iterable);
  var list = [];
  while (true) {
    var step = iter.next();
    if (step.done !== false) return [value, list];
    var accumulated = fn(value, step.value);
    value = accumulated[0];
    list.push(accumulated[1]);
  }
}

// unfoldr :: (b -> Maybe (a, b)) -> b -> [a] Source
function expand(fn, initialSeed) {
  return new LodaIterable(function () {
    var seed = initialSeed;
    return function() {
      var result = Maybe(fn(seed));
      if (result.is()) {
        var resultTuple = result.get();
        seed = resultTuple[0];
        return _iteratorValue(resultTuple[1]);
      }
      return ITERATOR_DONE;
    }
  });
}



/*

TODO: un-reduce aka expand


unfoldr :: (b -> Maybe (a, b)) -> b -> [a] Source

The unfoldr function is a `dual' to foldr: while foldr reduces a list to a summary value, unfoldr builds a list from a seed value. The function takes the element and returns Nothing if it is done producing the list or returns Just (a,b), in which case, a is a prepended to the list and b is used as the next element in a recursive call. For example,

iterate f == unfoldr (\x -> Just (x, f x))
In some cases, unfoldr can undo a foldr operation:



*/


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

var eq = curry(argComparer(is), 2);

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
 * Indexed
 * -------
 */
var get = curry(function (key, indexed) {
  return indexed && indexed[key];
});


// sequence :: Monad m => [m a] -> m [a]
function arrayM(monadList, monadType) {
  var iter = _iterator(monadList);
  var step = iter.next();
  if (step.done !== false) {
    return monadType ? unit(monadType, []) : [];
  }
  var list = unit(step.value, []);
  while (true) {
    list = ap(lift(curriedPushIn, list), step.value);
    step = iter.next();
    if (step.done !== false) return list;
  }
}

var curriedPushIn = curry(pushIn);




function liftResult(fn, promise) {
  return chainResult(function (a) { return unit(promise, fn(a)); }, promise);
}

function chainResult(fn, promise) {
  if (promise.then) { // is Promise
    return promise.then(
      function (success) { return fn(Maybe.Value(success)); },
      function (failure) { return fn(failure ? Maybe.Error(failure) : Maybe.None); }
    );
  }
  throw new Error('Value provided is not Promise: ' + promise);
}

// :: (Monad joinable) => joinable<joinable<T>> -> joinable<T>
function joinM(joinable) {
  if (joinable == null) {
    return joinable;
  }
  if (joinable.then) {
    // Promise/A+ joins itself.
    return joinable;
    // return chain(function (result) {
    //   return result.then ? result : unit(joinable, result);
    // }, joinable);
  }
  if (joinable.join) {
    return joinable.join();
  }
  if (isIterable(joinable)) {
    var val = _iterator(joinable).next().value;
    return isIterable(val) ? val : joinable;
  }
  // The "null case" is an uncontained value, which joins to itself.
  return joinable;
}

// :: (Monad m) => (T -> M<boolean>) -> T[] -> M<T[]>
// optionally provide a monad instance or class as the third argument
// to handle the empty-list, otherwise we will call predicate() with no args.

// TODO: this implementation results in each dequeue of the iterator happening
// once the previous chain has executed. For promises, this results in a serial
// execution order. This behavior may want to be preserved, but it should
// probably not be the default. See mapM and arrayM as examples of where
// optimistic dequeuing of the iteration results in parallel execution of
// promises. The other *M methods may be vulnerable to this slow-down...

function filterM(predicate, iterable, monadType) {
  return filterMDeep(predicate, array(iterable), 0, monadType);
}

function filterMDeep(predicate, array, index, monadType) {
  if (index >= array.length) {
    return unit(monadType ? monadType : predicate(), []);
  }
  var value = array[index];
  var passMonad = predicate(value);
  return chain(function (pass) {
    return lift(function (list) {
      return list.length ?
        pass ? [value].concat(list) : list :
        pass ? [value] : [];
    }, filterMDeep(predicate, array, index + 1, passMonad));
  }, passMonad);
}


// mapM :: Monad m => (a -> m b) -> [a] -> m [b]
var mapM = compose(arrayM, map);

function mapValM(fn, iterable) {
  return arrayM(map(function (kv) {
    var k = kv[0];
    var v = kv[1];
    return lift(partial(tuple, k), fn(v));
  }, iterable));
}


// filterM p []       = return []
// filterM p (x : xs) =
//   do
//     b  <- p x
//     ys <- filterM p xs
//     return (if b then (x : ys) else ys)


// function ffilter(predicate, list) {
//   var iter = iterator(list);
//   var result;
//   var step = iter.next();
//   if (step.done !== false) return result;
//   result = predicate(step.value);
//   result = lift(function (passed) {
//     return passed ? [step.value] : [];
//   }, result);

//   while (true) {
//     step = iter.next();
//     if (step.done !== false) return result;
//     result = lift(function (passed) {
//       return
//     }, predicate(step.value));
//   }
// }

// :: (Monad M) => (T -> T -> M<T>) -> T[] -> M<T>
// :: (Monad M) => (T -> S -> M<T>) -> T -> S[] -> M<T>
// TODO: broken when Monad is a list? should not get first iteration before
// Empty list calls reducer with undefined?
// Note: This implies sequentialy resolving Monads. If using Promises, they will
// execute in sequence.
function reduceM(reducer, initial, iterable) {
  var iter = _iterator(iterable);
  var step = iter.next(); // TODO: empty lists?
  if (step.done !== false) {
    return reducer(initial);
  }
  var reduced = reducer(initial, step.value);
  while (true) {
    step = iter.next();
    if (step.done !== false) return reduced;
    reduced = chain(partialRight(reducer, step.value), reduced);
  }
}



function promise(fn) {
  // Hey, this looks a lot like chain...
  return new Promise(function (succeed, fail) {
    fn(function (value) {
      value instanceof Maybe || (value = Maybe(value));
      value.is() ?
        succeed(value.get()) :
        fail(value.isError() && value.getError());
    })
  })
}






/**
 * Maybe
 */
function Maybe(value) {
  return value == null || value !== value ? MaybeNone :
    value instanceof Maybe ? value :
    value instanceof Error ? new MaybeError(value) :
    new MaybeValue(value);
}

Maybe.of = Maybe;
Maybe.is = function (maybe) {
  return Maybe(maybe).is();
};
Maybe.isError = function (maybe) {
  return Maybe(maybe).isError();
};
Maybe.or = curry(function (fallback, maybe) {
  return Maybe(maybe).or(fallback);
});
Maybe.get = function (maybe) {
  return Maybe(maybe).get();
};
Maybe.getError = function (maybe) {
  return Maybe(maybe).getError();
};
Maybe['try'] = maybeTry;
Maybe.at = curry(maybeTry(function (key, indexed) {
  return indexed[key];
}));

function maybeTry(fn) { // TODO: handle curried fns
  return arity(fn.length, function() {
    try {
      return Maybe(fn.apply(this, arguments));
    } catch (error) {
      return MaybeError(error);
    }
  });
}


Maybe.prototype.toSource =
Maybe.prototype.inspect = function() {
  return this.toString();
}

Maybe.prototype.of = Maybe;
Maybe.prototype.is =
Maybe.prototype.isError = function() {
  return false;
}
Maybe.prototype.or = function(fallback) {
  return fallback;
}
Maybe.prototype.get = function() {
  throw new Error('Cannot get a value from ' + this);
}
Maybe.prototype.getError = function() {
  throw new Error('Cannot get an error from ' + this);
}
Maybe.prototype.join =
Maybe.prototype.map =
Maybe.prototype.ap =
Maybe.prototype.chain = function(fn) {
  return this;
}

function MaybeValue(value) {
  if (this instanceof MaybeValue) {
    this._value = value;
  } else {
    return new MaybeValue(value);
  }
}
MaybeValue.prototype = Object.create(Maybe.prototype);
MaybeValue.prototype.toString = function() {
  return 'Maybe.Value ' + this._value;
}
MaybeValue.prototype.is = function() {
  return true;
}
MaybeValue.prototype.or = function(fallback) {
  return this._value;
}
MaybeValue.prototype.get = function() {
  return this._value;
}
MaybeValue.prototype.equals = function(maybe) {
  return maybe.is() && is(this._value, maybe._value);
}
MaybeValue.prototype.join = function() {
  return this._value instanceof Maybe ? this._value : this;
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
Maybe.Value = MaybeValue;

function MaybeNone() {
  return MaybeNone;
}
MaybeNone.prototype = Object.create(Maybe.prototype);
MaybeNone.prototype.toString = function() {
  return 'Maybe.None';
}
MaybeNone.prototype.equals = function(maybe) {
  return maybe === MaybeNone;
}
MaybeNone.prototype.ap = function(maybe) {
  return maybe.isError() ? maybe : MaybeNone;
}
var setPrototypeOf = Object.setPrototypeOf || function (obj, proto) {
  obj.__proto__ = proto; // jshint ignore: line
  return obj;
}
setPrototypeOf(MaybeNone, MaybeNone.prototype);
Maybe.None = MaybeNone;

function MaybeError(error) {
  if (this instanceof MaybeError) {
    this._error = error;
  } else {
    return new MaybeError(error);
  }
}
MaybeError.prototype = Object.create(Maybe.prototype);
MaybeError.prototype.toString = function() {
  return 'Maybe.Error ' + this._error;
}
MaybeError.prototype.isError = function() {
  return true;
}
MaybeError.prototype.getError = function() {
  return this._error;
}
MaybeError.prototype.equals = function(maybe) {
  return maybe.isError() && is(this._error, maybe._error);
}
Maybe.Error = MaybeError;






/**
 * Internal helper methods
 */

function add2(x, y) {
  return x + y;
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

  'apply': curry(apply, 2),

  'decontextify': decontextify,
  'contextify': contextify,

  'complement': complement,
  'flip': flip,
  'juxt': juxt,
  'juxtM': juxtM,
  'knit': knit,

  'memo': memo,
  'isMemoized': isMemoized,
  'clearMemo': clearMemo,

  'iterable': _iterable,
  'iterator': _iterator,
  'isIterable': isIterable,
  'index': index,

  'array': array,
  'object': object,
  'string': string,
  'doall': curry(doall, 2),

  'isEmpty': isEmpty,
  'count': count,
  'take': curry(take, 2),
  'filter': curry(filter, 2),
  'map': curry(map, 2),
  'mapVal': curry(mapVal, 2),
  'zip': curry(zip, 2),
  'unzip': unzip, // TODO: test
  'concat': concat,
  'mapCat': mapCat,
  'flatten': flatten,
  'memoIterable': memoIterable,
  'join': join,
  'reduce': curry(reduce, 2),
  'reduced': reduced,
  'accumulate': curry(accumulate),
  'expand': curry(expand),
  'compare': curry(compare, 2),
  'every': curry(every, 2),
  'some': curry(some, 2),

  'id': id,
  'tuple': tuple,
  'pipe': pipe,

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

  'get': get,

  'reduceM': curry(reduceM, 2),
  'filterM': curry(filterM, 2),
  'mapM': curry(mapM, 2),
  'mapValM': curry(mapValM, 2),
  'joinM': joinM,
  'arrayM': arrayM,

  'promise': curry(promise),
  'liftResult': curry(liftResult),
  'chainResult': curry(chainResult),

  'Maybe': Maybe,
}

return module.exports; }

typeof module === 'object' ? universalModule(module) :
  typeof define === 'function' && define.amd ? define(universalModule) :
    loda = universalModule();
