(function(global, undefined) {


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
  return ARITY_CACHE[length] || (ARITY_CACHE[length] = makeArityFn(length));
}

function makeArityFn(length) {
  var arr = new Array(length), ii = 0;
  while (ii < length) {
    arr[ii] = '_' + ii++;
  }
  return new Function( /* jshint ignore: line */
    'fn',
    'return function('+arr.join(',')+'){return fn.apply(this, arguments);}'
  );
}




/**
 * Curry
 */

function curry(fn, arity) {
  arity = arity || fn.length;
  return arity <= 1 ? fn :
    getCurryFn(arity)(getCurryFn, CURRY_SYMBOL, uncurry(fn));
}

function curryRight(fn, arity) {
  arity = arity || fn.length;
  return arity <= 1 ? fn :
    getCurryRightFn(arity)(getCurryRightFn, CURRY_SYMBOL, uncurry(fn));
}

function isCurried(fn) {
  return !!fn[CURRY_SYMBOL];
}

function uncurry(fn) {
  return fn[CURRY_SYMBOL] || fn;
}

// Internal

var CURRY_SYMBOL = global.Symbol ? global.Symbol() : '@@_curried';
var CURRY_CACHE = [];
var CURRY_RIGHT_CACHE = [];

function getCurryFn(arity) {
  return CURRY_CACHE[arity] || (CURRY_CACHE[arity] = makeCurryFn(arity, false));
}

function getCurryRightFn(arity) {
  return CURRY_RIGHT_CACHE[arity] || (CURRY_RIGHT_CACHE[arity] = makeCurryFn(arity, true));
}

function makeCurryFn(arity, fromRight) {
  var cases = '';
  var curriedArgs = ['_0'];
  for (var ii = 1; ii < arity; ii++) {
    cases +=
      '      case ' + ii + ': return getCurryFn(' + (arity - ii) + ')(getCurryFn, curriedSymbol, function() {\n'+
      '        var args = ['+curriedArgs.join(',')+'];\n'+
      (fromRight ?
      '        for (var i = arguments.length - 1; i >= 0; i--) args.unshift(arguments[i]);\n' :
      '        for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);\n')+
      '        return fn.apply(this, args);\n'+
      '      });\n';
    curriedArgs.push('_' + ii);
  }
  return new Function( /* jshint ignore: line */
    'getCurryFn',
    'curriedSymbol',
    'fn',
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
// TODO: if you compose curried functions together, sum the lengths and return a
// curried function of the total length.
// If any function "upstream" is curried and has a length > 1, apply arguments to
// it first.
function compose(fn2, fn1) {
  var numFns = arguments.length - 1;
  if (numFns === 0) return fn2;
  var firstFn = arguments[numFns];
  var restFns = new Array(numFns); for (var $_i = 0; $_i < numFns; ++$_i) restFns[$_i] = arguments[$_i];
  return arity(firstFn.length, function composedFn() {
    var result = firstFn.apply(this, arguments);
    var ii = numFns;
    while (ii--) {
      result = restFns[ii].call(this, result);
    }
    return result;
  });
}

function composeRight() {
  return compose.apply(this, Array.prototype.reverse.call(arguments));
}



/**
 * Partial
 */

function partial(fn) {
  if (arguments.length === 1) return fn;
  var partialArgs = new Array(arguments.length - 1); for (var $_i = 1; $_i < arguments.length; ++$_i) partialArgs[$_i - 1] = arguments[$_i];
  return arity(fn.length - partialArgs.length, function partialFn() {
    return fn.apply(this, concatArgs(partialArgs, arguments));
  });
}

function partialRight(fn) {
  if (arguments.length === 1) return fn;
  var partialArgs = new Array(arguments.length - 1); for (var $_i = 1; $_i < arguments.length; ++$_i) partialArgs[$_i - 1] = arguments[$_i];
  return arity(fn.length - partialArgs.length, function partialFn() {
    return fn.apply(this, concatArgs(arguments, partialArgs));
  })
}

function concatArgs(indexed1, indexed2) {
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


function is(v1, v2) {
  return (
    v1 === 0 && v2 === 0 && 1 / v1 === 1 / v2 ||
    v1 === v2 ||
    v1 !== v1 && v2 !== v2 ||
    !!v1 && typeof v1.equals === 'function' && v1.equals(v2)
  );
}


var isArray = Array.isArray;

/**
 * Functors / Monads / Monoids
 */

// TODO: if value is just an iterator, use the list comprehension form.
// TODO: even if fn isn't curried, but it's length is > 1, it might still be
//       the right thing to return an Apply
// TODO: accept multiple args are do the apply chaining for us

// lift :: (a -> b) -> M a -> M b
function lift(fn, functor) {
  return  (
    functor == null ? functor : // Empty raw value
    isCurried(fn) && fn.length > 1 && functor.chain ? // Create an Apply // TODO: should functor.then and isArray be included here?
      bind(function (value) {
        return pure(functor, curry(partial(uncurry(fn), value), fn.length - 1));
      }, functor) :
    functor.map ? functor.map(fn) : // Functor
    functor.ap ? ap(pure(functor, fn), functor) : // Apply
    functor.chain && functor.of || functor.then ? // is Monad
      bind(function (value) { return pure(functor, fn(value)); }, functor) :
    fn(functor) // Raw value
  );
}



// TODO: handle curried case
// AKA <*>
function ap(appFn, appVal) {
  return (
    appFn == null || appVal == null ? null : // Empty raw value
    appFn.ap ? appFn.ap(appVal) : // Apply
    appFn.chain || appFn.then || isArray(appFn) ? // Monad (TODO: match iterables)
      bind(function (fn) { return lift(fn, appVal); }, appFn) :
    appFn(appVal) // Raw value
  );
}

// pure :: A<any> -> V -> A<V>
// pure :: Promise<any> -> Maybe<V> -> Promise<V>
// pure :: Promise<any> -> V -> Promise<V>
function pure(applicative, value) {
  if (applicative == null) {
    return applicative;
  }
  if (applicative.then) {
    applicative = applicative.constructor;
  }
  if (applicative.resolve && applicative.reject) { // is Promise
    return isValue(value) ?
      applicative.resolve(assertValue(value)) :
      applicative.reject(isError(value) && assertError(value));
  }
  if (applicative.of) { // is Applicative
    return applicative.of(value);
  }
  if (applicative.constructor.of) { // is Applicative Constructor
    return applicative.constructor.of(value);
  }
  if (isArray(applicative)) { // is Array
    return value == null ? [] : [value];
  }
  // TODO: handle this...
  // if (isIterable(applicative)) { // is Iterable
  //   return [value];
  // }
  // Not applicative? This is the "null case", value is returned as is.
  return value;
}

// TODO: accept multiple args and do the apply chaining for us
function bind(fn, monad) {
  return (
    monad == null ? monad : // Empty raw value
    monad.chain ? monad.chain(fn) : // Monad
    monad.then ? monad.then(fn) : // Promise
    isArray(monad) ? Array.prototype.concat.apply([], monad.map(fn)) : // Array
    fn(monad) // Raw value
  );
  // TODO: figure out how to model iterables
  // if (isIterable(monad)) { // is Iterable
  //   return concat(map(fn, monad));
  // }
}




function isMaybe(maybeMaybe) {
  return maybeMaybe && maybeMaybe.or && maybeMaybe.is && maybeMaybe.get &&
    maybeMaybe.map;
}

function isMaybeError(maybeMaybe) {
  return maybeMaybe && maybeMaybe.isError && maybeMaybe.getError &&
    maybeMaybe.map;
}

function valueOr(fallbackValue, maybeValue) {
  return maybeValue == null ? fallbackValue :
    isMaybe(maybeValue) ? maybeValue.or(fallbackValue) : maybeValue;
}

function isValue(maybeValue) {
  return isMaybe(maybeValue) ? maybeValue.is() : maybeValue != null;
}

function assertValue(maybeValue) {
  if (maybeValue == null) {
    throw new Error('Forced empty value: ' + maybeValue);
  }
  return isMaybe(maybeValue) ? maybeValue.get() : maybeValue;
}

function isError(maybeError) {
  return isMaybeError(maybeError) ? maybeError.isError() : maybeError instanceof Error;
}

function assertError(maybeError) {
  if (isMaybeError(maybeError)) {
    return maybeError.getError();
  }
  if (maybeError instanceof Error) {
    return maybeError;
  }
  throw new Error('Forced error: ' + maybeError);
}



/**
 * Indexed
 * -------
 */

var get = curry(function get(key, indexed) {
  return indexed && indexed[key];
});



global.arity = arity;
global.compose = compose;
global.composeRight = composeRight;
global.partial = partial;
global.partialRight = partialRight;
global.curry = curry;
global.curryRight = curryRight;
global.uncurry = uncurry;
global.isCurried = isCurried;

global.is = curry(is);
global.lift = curry(lift);
global.ap = curry(ap);
global.pure = curry(pure);
global.bind = curry(bind);

global.get = get;

global.valueOr = curry(valueOr);
global.isValue = isValue;
global.assertValue = assertValue;
global.isError = isError;
global.assertError = assertError;
 /* jshint ignore: line */

}.call(null,
  Function('return this')() /* jshint ignore: line */
));
