(function(global, undefined) {

/**
 * Composition
 */
// TODO: if you compose curried functions together, sum the lengths and return a
// curried function of the total length.
// If any function "upstream" is curried and has a length > 1, apply arguments to
// it first.
function compose(fn2, fn1) {
  var fns = new Array(arguments.length); for (var $_i = 0; $_i < arguments.length; ++$_i) fns[arguments.length - $_i - 1] = arguments[$_i];
  if (fns.length === 1) return fn2;
  return composeList(fns);
}

function composeRight(fn1, fn2) {
  var fns = new Array(arguments.length); for (var $_i = 0; $_i < arguments.length; ++$_i) fns[$_i] = arguments[$_i];
  if (fns.length === 1) return fn1;
  return composeList(fns);
}

function composeList(fns) {
  var firstFn = fns[0];
  return arity(firstFn.length, function composed(arg) {
    var result = firstFn.apply(this, arguments);
    var ii = 0;
    while (++ii < fns.length) {
      result = fns[ii].call(this, result);
    }
    return result;
  });
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

// lift :: M a -> (a -> b) -> M b
function lift(functor, fn) {
  return (
    isRawNone(functor) ? functor : // Raw none value
    isCurried(fn) && fn.length > 1 && functor.chain ? // Create an Apply // TODO: should functor.then and isArray be included here?
      chain(functor, function (value) {
        return unit(functor, curry(partial(uncurry(fn), value), fn.length - 1));
      }) :
    isArray(functor) ? functor.map(mapValues(fn)) :
    functor.map ? functor.map(fn) : // Functor
    functor.ap ? apply(unit(functor, fn), functor) : // Apply
    functor.chain && functor.of || functor.then ? // is Monad
      chain(functor, function (value) { return unit(functor, fn(value)); }) :
    fn(functor) // Raw value
  );
}

var isArray = Array.isArray;

function mapValues(mapper) {
  return function (value) {
    return isRawNone(value) ? value : mapper(value);
  }
}



// TODO: handle curried case
// AKA <*>
function apply(appFn, appVal) {
  return (
    appFn && appFn.ap ? appFn.ap(appVal) : // Apply
    chain(appFn, function (fn) { return lift(appVal, fn); }) // Other
  );
}

// unit :: A<any> -> V -> A<V>
// unit :: Promise<any> -> Maybe<V> -> Promise<V>
// unit :: Promise<any> -> V -> Promise<V>
function unit(applicative, value) {
  if (isRawNone(applicative)) {
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
    applicative.constructor ? new applicative.constructor(value) : // Constructor
    value // Raw value
  );
  // TODO: iterable
}

// TODO: accept multiple args and do the apply chaining for us
function chain(monad, fn) {
  return (
    isRawNone(monad) ? monad : // Raw none value
    monad.chain ? monad.chain(fn) : // Monad
    monad.mapCat ? monad.mapCat(fn) : // Monad Alias
    monad.flatMap ? monad.flatMap(fn) : // Monad Alias
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
  return maybeMaybe.or && maybeMaybe.isValue && maybeMaybe.get && maybeMaybe.map;
}

function isMaybeError(maybeMaybe) {
  return maybeMaybe && maybeMaybe.isError && maybeMaybe.getError &&
    maybeMaybe.map;
}

function valueOr(fallbackValue, maybeValue) {
  return isRawNone(maybeValue) ? fallbackValue :
    isMaybe(maybeValue) ? maybeValue.or(fallbackValue) : maybeValue;
}

function isRawNone(maybeValue) {
  return maybeValue == null || maybeValue !== maybeValue;
}

function isValue(maybeValue) {
  return !(isRawNone(maybeValue) || isMaybe(maybeValue) && !maybeValue.isValue());
}

function assertValue(maybeValue) {
  if (isRawNone(maybeValue)) {
    throw new Error('Forced none value: ' + maybeValue);
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
global.lift = curryRight(lift);
global.apply = curry(apply);
global.unit = curry(unit);
global.chain = curryRight(chain);

global.valueOr = curry(valueOr);
global.isValue = isValue;
global.assertValue = assertValue;
global.isError = isError;
global.assertError = assertError;

}(Function('return this')()))
