/**
 * Javascript's missing Function manipulation functions.
 *
 *   - Composition
 *   - Partial application
 *   - Setting arity (function.length)
 *   - Currying functions
 *
 */

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

global.compose = compose;
global.composeRight = composeRight;
global.partial = partial;
global.partialRight = partialRight;
global.arity = arity;
global.curry = curry;
global.curryRight = curryRight;
global.uncurry = uncurry;
global.isCurried = isCurried;
