/**
 * Javascript's missing Algebraic value functions.
 *
 *   - Equality (equal)
 *   - Map (aka lift)
 *   - Apply (aka ap)
 *   - Unit (aka return/pure)
 *   - Chain (aka bind/then)
 *   - Non-none Value checking
 *
 */



/**
 * Functors / Monads / Monoids
 */

// equals :: a -> b -> boolean
function equals(v1, v2) {
  return !!(
    v1 === v2 ||
    v1 && typeof v1.equals === 'function' && v1.equals(v2)
  );
}

// map :: M a -> (a -> b) -> M b
function map(functor, fn) {
  return (
    isRawNone(functor) ? functor : // Raw none value
    isArray(functor) ? functor.map(mapValues(fn)) :
    functor.map ? functor.map(fn) : // Functor
    functor.ap && functor.of ? apply(of(functor, fn), functor) : // Apply
    functor.chain && functor.of || functor.then ? // is Monad
      chain(functor, function (value) { return of(functor, fn(value)); }) :
    fn(functor) // Raw value
  );
}

var isArray = Array.isArray;

function mapValues(mapper) {
  return function (value) {
    return isRawNone(value) ? value : mapper(value);
  }
}


// apply :: M (a -> b) -> M a -> M b
function apply(appFn, appVal) {
  return (
    appFn && appFn.ap ? appFn.ap(appVal) : // Apply
    chain(appFn, function (fn) { return map(appVal, fn); }) // Other
  );
}

// of :: M a -> b -> M b
// of :: Promise a -> b -> Promise b
// of :: Promise a -> Maybe b -> Promise b
function of(applicative, value) {
  return (
    isRawNone(applicative) ? applicative : // Raw none value
    applicative.of ? applicative.of(value) : // Applicative
    applicative.constructor.of ? applicative.constructor.of(value) : // Applicative Constructor
    isArray(applicative) ? isValue(value) ? [] : [value] : // Array
    applicative.then ? new applicative.constructor(function (resolve, reject) { // Promise
      return isValue(value) ?
        resolve(getValue(value)) :
        reject(isError(value) && assertError(value));
    }) :
    (function() { throw new Error('Not applicative: ' + applicative); }())
  );
}

// chain :: M a -> (a -> M b) -> M b
// chain :: Promise a -> (a -> Promise b) -> Promise b
// chain :: Maybe a -> (a -> Maybe b) -> Maybe b
// chain :: Array a -> (a -> Array b) -> Array b
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
}



// Value checking

function isRawNone(maybeValue) {
  return maybeValue == null || maybeValue !== maybeValue;
}

function isValue(maybeValue) {
  return !(
    isRawNone(maybeValue) ||
    typeof maybeValue.isValue === 'function' && !maybeValue.isValue()
  );
}

function getValue(maybeValue) {
  if (!isValue(maybeValue)) {
    throw new Error('Must be non-none value: ' + maybeValue);
  }
  return typeof maybeValue.getValue === 'function' ?
    maybeValue.getValue() :
    maybeValue;
}

function valueOr(maybeValue, fallbackValue) {
  return isRawNone(maybeValue) ? fallbackValue :
    typeof maybeValue.valueOr === 'function' ?
      maybeValue.valueOr(fallbackValue) :
      maybeValue;
}


//////


function isMaybeError(maybeMaybe) {
  return maybeMaybe && maybeMaybe.isError && maybeMaybe.getError &&
    maybeMaybe.map;
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


global.equals = equals;
global.map = map;
global.apply = apply;
global.of = of;
global.chain = chain;

global.isValue = isValue;
global.getValue = getValue;
global.valueOr = valueOr;

global.isMaybeError = isMaybeError;
global.isError = isError;
global.assertError = assertError;
