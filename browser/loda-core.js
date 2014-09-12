(function(global, undefined) {

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
  return arity(firstFn.length, function composed(arg) {
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
 *
 * http://jsperf.com/partial-application
 */

function partial(fn) {
  if (arguments.length === 1) return fn;
  var partialArgs = new Array(arguments.length - 1); for (var $_i = 1; $_i < arguments.length; ++$_i) partialArgs[$_i - 1] = arguments[$_i];
  return arity(fn.length - partialArgs.length, function partialFn() {
    var restArgs = new Array(arguments.length); for ($_i = 0; $_i < arguments.length; ++$_i) restArgs[$_i] = arguments[$_i];
    return fn.apply(this, concatArgs(partialArgs, restArgs));
  });
}

function partialRight(fn) {
  if (arguments.length === 1) return fn;
  var partialArgs = new Array(arguments.length - 1); for (var $_i = 1; $_i < arguments.length; ++$_i) partialArgs[$_i - 1] = arguments[$_i];
  return arity(fn.length - partialArgs.length, function partialFn() {
    var restArgs = new Array(arguments.length); for ($_i = 0; $_i < arguments.length; ++$_i) restArgs[$_i] = arguments[$_i];
    return fn.apply(this, concatArgs(restArgs, partialArgs));
  });
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
  var args = new Array(length);
  while (length--) {
    args[length] = 'a' + length;
  }
  return new Function( /* jshint ignore: line */
    'fn',
    'return function('+args.join(',')+'){return fn.apply(this, arguments);}'
  );
}




/**
 * Curry
 */

function curry(fn, arity) {
  arity = arity || fn.length;
  return arity === 0 ? fn :
    getCurryFn(arity)(getCurryFn, markCurried, uncurry(fn));
}

function curryRight(fn, arity) {
  arity = arity || fn.length;
  return arity === 0 ? fn :
    getCurryRightFn(arity)(getCurryRightFn, markCurried, uncurry(fn));
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

function markCurried(curried, original) {
  Object.defineProperty ?
    Object.defineProperty(curried, CURRY_SYMBOL, { value: original }) :
    (curried[CURRY_SYMBOL] = original);
}

function makeCurryFn(arity, fromRight) {
  var cases = '';
  var curriedArgs = ['a0'];
  for (var ii = 1; ii < arity; ii++) {
    cases +=
      'case ' + ii + ':return c(' + (arity - ii) + ')(c,m,function(){' +
        'var a=['+curriedArgs.join(',')+'];' +
      (fromRight ?
        'for (var i = arguments.length - 1; i >= 0; i--) a.unshift(arguments[i]);' :
        'for (var i = 0; i < arguments.length; i++) a.push(arguments[i]);') +
        'return fn.apply(this, a);' +
      '});';
    curriedArgs.push('a' + ii);
  }
  return new Function( /* jshint ignore: line */
    'c',
    'm',
    'fn',
    'var cfn = function curried( '+curriedArgs.join(', ')+' ) {\n' +
      'switch (arguments.length){' +
        'case 0:return cfn;' +
        cases +
      '}' +
      'return fn.apply(this, arguments);' +
    '};' +
    'm(cfn,fn);' +
    'return cfn;'
  );
}



/**
 * Functors / Monads / Monoids
 */

function is(v1, v2) {
  return (
    v1 === 0 && v2 === 0 && 1 / v1 === 1 / v2 ||
    v1 === v2 ||
    v1 !== v1 && v2 !== v2 ||
    !!v1 && typeof v1.equals === 'function' && v1.equals(v2)
  );
}

// TODO: if value is just an iterator, use the list comprehension form.
// TODO: even if fn isn't curried, but it's length is > 1, it might still be
//       the right thing to return an Apply
// TODO: accept multiple args are do the apply chaining for us

// lift :: (a -> b) -> M a -> M b
function lift(fn, functor) {
  return (
    isRawEmpty(functor) ? functor : // Empty raw value
    isCurried(fn) && fn.length > 1 && functor.chain ? // Create an Apply // TODO: should functor.then and isArray be included here?
      bind(function (value) {
        return unit(functor, curry(partial(uncurry(fn), value), fn.length - 1));
      }, functor) :
    isArray(functor) ? functor.map(mapValues(fn)) :
    functor.map ? functor.map(fn) : // Functor
    functor.ap ? ap(unit(functor, fn), functor) : // Apply
    functor.chain && functor.of || functor.then ? // is Monad
      bind(function (value) { return unit(functor, fn(value)); }, functor) :
    fn(functor) // Raw value
  );
}

var isArray = Array.isArray;

function mapValues(mapper) {
  return function (value) {
    return isRawEmpty(value) ? value : mapper(value);
  }
}



// TODO: handle curried case
// AKA <*>
function ap(appFn, appVal) {
  return (
    isRawEmpty(appFn) ? appFn : isRawEmpty(appVal) ? appVal : // Empty raw value
    appFn.ap ? appFn.ap(appVal) : // Apply
    appFn.chain || appFn.then || isArray(appFn) ? // Monad (TODO: match iterables)
      bind(function (fn) { return lift(fn, appVal); }, appFn) :
    appFn(appVal) // Raw value
  );
}

// unit :: A<any> -> V -> A<V>
// unit :: Promise<any> -> Maybe<V> -> Promise<V>
// unit :: Promise<any> -> V -> Promise<V>
function unit(applicative, value) {
  if (isRawEmpty(applicative)) {
    return applicative;
  }
  if (applicative.then) {
    applicative = applicative.constructor;
  }
  return (
    applicative.of ? applicative.of(value) : // Applicative
    applicative.constructor.of ? applicative.constructor.of(value) : // Applicative Constructor
    isArray(applicative) ? isValue(value) ? [] : [value] : // Array
    applicative.resolve && applicative.reject ? // Promise
      isValue(value) ? applicative.resolve(assertValue(value)) :
        applicative.reject(isError(value) && assertError(value)) :
    value // Raw value
  );
  // TODO: iterable
}

// TODO: accept multiple args and do the apply chaining for us
function bind(fn, monad) {
  return (
    isRawEmpty(monad) ? monad : // Empty raw value
    monad.chain ? monad.chain(fn) : // Monad
    monad.then ? monad.then(fn) : // Promise
    isArray(monad) ? Array.prototype.concat.apply([], monad.map(mapValues(fn))) : // Array
    fn(monad) // Raw value
  );
  // TODO: figure out how to model iterables
  // if (isIterable(monad)) { // is Iterable
  //   return concat(map(fn, monad));
  // }
}



// Value checking

function isMaybe(maybeMaybe) {
  return maybeMaybe.or && maybeMaybe.is && maybeMaybe.get && maybeMaybe.map;
}

function isMaybeError(maybeMaybe) {
  return maybeMaybe && maybeMaybe.isError && maybeMaybe.getError &&
    maybeMaybe.map;
}

function valueOr(fallbackValue, maybeValue) {
  return isRawEmpty(maybeValue) ? fallbackValue :
    isMaybe(maybeValue) ? maybeValue.or(fallbackValue) : maybeValue;
}

function isRawEmpty(maybeValue) {
  return maybeValue == null || maybeValue !== maybeValue;
}

function isValue(maybeValue) {
  return !(isRawEmpty(maybeValue) || !isMaybe(maybeValue) || maybeValue.is());
}

function assertValue(maybeValue) {
  if (isRawEmpty(maybeValue)) {
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



// Export

global.compose = compose;
global.composeRight = composeRight;
global.partial = partial;
global.partialRight = partialRight;
global.arity = arity;
global.curry = curry;
global.curryRight = curryRight;
global.uncurry = uncurry;
global.isCurried = isCurried;

global.is = curry(is);
global.lift = curry(lift);
global.ap = curry(ap);
global.unit = curry(unit);
global.bind = curry(bind);

global.valueOr = curry(valueOr);
global.isValue = isValue;
global.assertValue = assertValue;
global.isError = isError;
global.assertError = assertError;

}(Function('return this')()))
