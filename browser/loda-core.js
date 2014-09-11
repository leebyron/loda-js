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
 * Curry
 */

function curry(fn, arity) {
  arity = arity || fn.length;
  return arity > 1 ?
    getCurryFn(arity)(getCurryFn, CURRY_SYMBOL, uncurry(fn)) :
    fn;
}

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

var CURRY_SYMBOL = global.Symbol ? global.Symbol() : '@__curried__@';
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
    v1 && typeof v1.equals === 'function' && v1.equals(v2)
  );
}


/**
 * Functors / Monads / Monoids
 */

// TODO: if value is just an iterator, use the list comprehension form.
// TODO: even if fn isn't curried, but it's length is > 1, it might still be
//       the right thing to return an Apply
// TODO: accept multiple args are do the apply chaining for us

// lift :: (a -> b) -> M a -> M b
function lift(fn, functor) {
  if (functor == null) {
    return functor;
  }
  if (isCurried(fn) && fn.length > 1 && functor.chain) {
    return bind(function (value) {
      return pure(functor, curry(partial(uncurry(fn), value), fn.length - 1));
    }, functor);
  }
  if (functor.map && !isArray(functor)) { // is Functor
    return functor.map(fn);
  }
  if (functor.ap) { // is Apply
    return ap(pure(functor, fn), functor);
  }
  if ((functor.chain && functor.of) || functor.then) { // is Monad
    return bind(function (a) { return pure(functor, fn(a)); }, functor);
  }
  // Hold the monadic property that lift should return a value of the same type,
  // so lifting an Array should return an Array, not an Iterable.
  if (isArray(functor)) {
    return functor.map(fn);
  }
  // TODO: figure out the best way to extend this to iterable objects.
  // Other iterables are just going to be rule-breakers for the moment.
  // if (isIterable(functor)) { // is Iterable
  //   return map(fn, functor);
  // }
  // Treat raw values as a pseudo-Maybe.
  return fn(functor);
}


var isArray = Array.isArray;



// TODO: handle curried case
// AKA <*>
function ap(appFn, appVal) {
  if (appFn == null || appVal == null) {
    return null;
  }
  if (appFn.ap) { // is Apply
    return appFn.ap(appVal);
  }
  // is Chain, Promise, or Iterable --- iterables come later?
  if (appFn.chain || appFn.then || isArray(appFn)) { // TODO: handle iterable case
    return bind(function (fn) { return lift(fn, appVal); }, appFn);
  }
  // Treat raw values as pseudo-Maybe
  return appFn(appVal);
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
    value instanceof Maybe || (value = Maybe(value)); // TODO: Maybe idempotent
    return value.is() ?
      applicative.resolve(value.get()) :
      applicative.reject(value.isError() && value.getError());
  }
  if (applicative.of) { // is Applicative
    return applicative.of(value);
  }
  if (isArray(applicative)) { // is Array
    return [value];
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
  if (monad == null) {
    return monad;
  }
  if (monad.chain) { // is Chain
    return monad.chain(fn);
  }
  if (monad.then) { // is Promise
    return monad.then(fn);
  }
  if (isArray(monad)) { // is Array
    return Array.prototype.concat.apply([], monad.map(fn));
  }

  // TODO: figure out how to model iterables
  // if (isIterable(monad)) { // is Iterable
  //   return concat(map(fn, monad));
  // }
  // Treat raw values as a pseudo-Maybe.
  return fn(monad);
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
Maybe['try'] = function(fn) { // TODO: handle curried fns
  return arity(fn.length, function() {
    try {
      return Maybe(fn.apply(this, arguments));
    } catch (error) {
      return MaybeError(error);
    }
  });
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
MaybeNone.prototype.toString =
MaybeNone.prototype.toSource =
MaybeNone.prototype.inspect = function() {
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
MaybeError.prototype.toString =
MaybeError.prototype.toSource =
MaybeError.prototype.inspect = function() {
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
 * Indexed
 * -------
 */

var get = curry(function get(key, indexed) {
  return indexed && indexed[key];
});

var at = curry(Maybe['try'](function (key, indexed) {
  return indexed[key];
}));




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

global.Maybe = Maybe;

global.get = get;
global.at = at;
 /* jshint ignore: line */

}.call(null,
  Function('return this')() /* jshint ignore: line */
));
