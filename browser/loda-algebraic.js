(function(global, undefined) {

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
  return (
    v1 === 0 && v2 === 0 && 1 / v1 === 1 / v2 ||
    v1 === v2 ||
    v1 !== v1 && v2 !== v2 ||
    !!v1 && typeof v1.equals === 'function' && v1.equals(v2)
  );
}

// map :: M a -> (a -> b) -> M b
function map(functor, fn) {
  return (
    isRawNone(functor) ? functor : // Raw none value
    isArray(functor) ? functor.map(mapValues(fn)) :
    functor.map ? functor.map(fn) : // Functor
    functor.ap && functor.of ? apply(unit(functor, fn), functor) : // Apply
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


// apply :: M (a -> b) -> M a -> M b
function apply(appFn, appVal) {
  return (
    appFn && appFn.ap ? appFn.ap(appVal) : // Apply
    chain(appFn, function (fn) { return map(appVal, fn); }) // Other
  );
}

// unit :: M a -> b -> M b
// unit :: Promise a -> b -> Promise b
// unit :: Promise a -> Maybe b -> Promise b
function unit(applicative, value) {
  return (
    isRawNone(applicative) ? applicative : // Raw none value
    applicative.of ? applicative.of(value) : // Applicative
    applicative.constructor.of ? applicative.constructor.of(value) : // Applicative Constructor
    isArray(applicative) ? isValue(value) ? [] : [value] : // Array
    applicative.then ? new applicative.constructor(function (resolve, reject) { // Promise
      return isValue(value) ?
        resolve(assertValue(value)) :
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


global.equals = equals;
global.map = map;
global.apply = apply;
global.unit = unit;
global.chain = chain;

global.valueOr = valueOr;
global.isValue = isValue;
global.assertValue = assertValue;
global.isError = isError;
global.assertError = assertError;

}(Function('return this')()))
