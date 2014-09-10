/**
 * Macros
 * ------
 *
 * Loda provides sweet.js macros to greatly ease developing in loda's
 * opinionated style of pure functions and monadic values.
 *
 * Use of these Macros assumes that Loda has been globally installed.
 *
 * Use these macros with your code by including this file as a module.
 *
 *     sjs --readable-names --module ./loda-js/macros/loda.macros.js your_code.js
 *
 */



/**
 * Maybe and Lifting
 * -----------------
 */



/**
 * Forcefully Unwrapping Maybe
 * ===========================
 *
 * Use `!` as a post-fix operator to forcefully get a value from a Maybe.
 * If the Maybe does not contain a value, an exception will be thrown!
 *
 * Also works with regular values.
 *
 *     var a = null;
 *     var b = Maybe.None;
 *     var c = Maybe('abc');
 *     console.log(a!); // Throws an exception
 *     console.log(b!); // Throws an exception
 *     console.log(c!); // "abc"
 *
 * Can be used as part of a property access or method call chain:
 *
 *     console.log(c!.toUpperCase()) // "ABC"
 *
 */
macro (!) {
  // Leave negation alone.
  rule infix { | $negatable:expr } => {
    $[!] $negatable
  }

  // a! => Maybe.get(a)
  rule infix { $maybe:expr | } => {
    Maybe.get($maybe)
  }
}



/**
 * Unwrapping Maybe with Fallback
 * ==============================
 *
 * Use `?:` to get a value from a Maybe, with a fallback value should the Maybe
 * be without a value.
 *
 * This is similar to JavaScript's `||` operator, however it only falls through
 * on null values instead of falsey values, making it safe to use with numbers
 * and booleans.
 *
 * Also works with regular values.
 *
 *     var a = null;
 *     var b = Maybe.None;
 *     var c = Maybe('abc');
 *     console.log(a ?: 'oops'); // "oops"
 *     console.log(b ?: 'oops'); // "oops"
 *     console.log(c ?: 'oops'); // "abc"
 *
 * While this expands to `Maybe.or(otherwise, maybe)`, it's isomorphic to:
 *
 *     maybe? ? maybe! : otherwise
 *
 */
macro (?:) {
  // a ?: b => Maybe.or(b, a)
  rule infix { $maybe:expr | $otherwise:expr } => {
    Maybe.or($otherwise, $maybe)
  }
}



// Property Access and Method Call chaining of Monadic values.
// The `?` operator is used in a couple different ways, depending on context.
// The order of rules in this macro is significant.
macro (?) {

  // Allow use of value? in ternaries, see below.
  rule infix { $maybe:expr | $[?] $then:expr : $otherwise:expr } => {
    Maybe.is($maybe) $[?] $then : $otherwise
  }

  // Leave regular ternaries alone.
  rule infix { $cond:expr | $then:expr : $otherwise:expr } => {
    $cond $[?] $then : $otherwise
  }


  /**
   * Chaining Maybe, Lifting properties
   * ==================================
   *
   * Lifting property access and method calls from a monadic value with `?.`
   *
   * Given a monadic value, such as Maybe or Promise, lift a property access or
   * a method call from the contained value.
   *
   * In other words: `a?.method()` calls `method` on `a` only
   * if `a` is a value (not null or Maybe.None). However, `?.` results in
   * another `Maybe` value, so the result of `a?.method()` is Maybe the result
   * of `method()`.
   *
   * As an example:
   *
   *     var a = Maybe('abc');
   *     var b = a?.toUpperCase();
   *     console.log(b); // Maybe
   *     console.log(b!); // "ABC"
   *
   * An example with property access:
   *
   *     var a = Maybe('abc');
   *     var b = a?.length;
   *     console.log(b); // Maybe
   *     console.log(b!); // 3
   *
   * It also works with raw values, instead of `Maybe`.
   *
   *     var a = 'abc';
   *     var b = a?.toUpperCase();
   *     console.log(b); // "ABC"
   *
   *     var x = null;
   *     var y = x?.toUpperCase();
   *     console.log(y); // null
   *
   * `Maybe` is a monadic value, and `?.` works for all monadic values.
   * `Promise` is another common monadic value. Lifting a `Promise` with `?.`
   * results in another `Promise`.
   *
   * Consider this example, where `a` is a Promise to get the string "abc"
   *
   *     var a = new Promise(resolve => setTimeout(resolve, 1000, 'abc'));
   *     var b = a?.toUpperCase();
   *     console.log(b); // Promise
   *     b.then((value) => console.log(value)); // "ABC" (after a second)
   *
   * Here's a mind-bender. Iterable objects (such as Array) are also monadic.
   * Lifting an Array results in another Array, but with the function applied
   * to every element (aka "map").
   *
   *     var a = [ 'a', 'b', 'c' ];
   *     var b = a?.toUpperCase();
   *     console.log(b); // [ 'A', 'B', 'C' ]
   *
   *
   * ### Chaining
   *
   * `?.` can be chained:
   *
   *     var a = 'abc';
   *     var b = a?.toUpperCase()?.indexOf('B');
   *     console.log(b); // 1
   *
   *     var x = null;
   *     var y = x?.toUpperCase()?.indexOf('B');
   *     console.log(y); // null
   *
   */
  // a?.b => lift(at('b'), a)
  // a?[b] => lift(at(b), a)
  // a?.b(x) => lift(function(v){return v.b(x);}, a)
  // a?[b](x) => lift(function(v){return v[b](x);}, a)
  rule infix { $monad:expr | $liftfn:liftable } => {
    lift($liftfn, $monad)
  }


  /**
   * Checking Maybe
   * ==============
   *
   * Use `?` as a post-fix operator to determine if it represents a value (as
   * opposed to null or Maybe.None).
   *
   * Also works with regular values.
   *
   *     var a = null;
   *     var b = Maybe.None;
   *     var c = Maybe('abc');
   *     console.log(a?); // false
   *     console.log(b?); // false
   *     console.log(c?); // true
   *
   * It is often useful at the end of a chained `?.` access of Maybes:
   *
   *     var obj = {x:{y:{z:'value'}}}
   *     console.log(obj?.x?.y?.z?) // true
   *     console.log(obj?.x?.w?.v?) // false
   *
   * This is similar to JavaScript's boolean casting `!!`, however it only
   * compares to null values rather than falsey values, making it safe to use
   * with numbers and booleans.
   *
   *     var a = null;
   *     var b = false;
   *     var c = 0;
   *     console.log(!!a); // false
   *     console.log(!!b); // false
   *     console.log(!!c); // false
   *     console.log(a?); // false
   *     console.log(b?); // true
   *     console.log(c?); // true
   *
   */
  // a? => Maybe.is(a)
  rule infix { $maybe:expr | } => {
    Maybe.is($maybe)
  }
}

macro liftable {
  rule { $method:method_call } => {
    function (value) { return value $method; }
  }
  rule { $key:property_access } => {
    at($key)
  }
}

macro method_call {
  rule { . $name:ident ($args (,) ...) }
  rule { [ $name:expr ] ($args (,) ...) }
}

macro property_access {
  case { _ . $tok:ident } => {
    return [makeValue(#{ $tok }.map(unwrapSyntax).join(''), #{ here })];
  }
  case { _ [ $subscript:expr ] } => {
    return #{ $subscript }
  }
}



/**
 * Implicitly Unwrapping Maybe
 * ===========================
 *
 * Safe unwrapping of a Maybe by way of an if statement.
 * The variable is only assigned if the maybe has a value.
 *
 *     var maybeABC = Maybe('abc');
 *     if (var abc = maybeABC) {
 *       console.log(abc);
 *     } else {
 *       console.log('flunked preschool');
 *     }
 *
 * Note: unwrapping if cannot be used in an `else if`.
 */
let if = macro {
  // if (var x = maybe) {...} => if (maybe?) {var x = maybe! ...}
  rule { ( $def:definition = $maybe:expr ) { $body ... } } => {
    var maybe = $maybe;
    if (maybe?) {
      $def = maybe!;
      $body ...
    }
  }
  // Default, don't mess with regular if statements
  rule {} => { if }
}

macro definition {
  rule { var $name:ident }
  // ES6 let scope
  rule { let $name:ident }
}



/**
 * Composition, calling and binding
 * --------------------------------
 */



/**
 * Functional composition
 * ======================
 *
 *     var h = f >< g;
 *     // h(x) equivalent to f(g(x))
 *
 */
operator (><) 14 right { $l, $r } => #{ compose($l, $r) }



/**
 * Monadic bind
 * ============
 *
 * Binds the right function to the left monadic value.
 *
 *     var getInt = Maybe >< parseInt;
 *     var maybeNumber = Maybe("123") >=> getInt // Maybe 123
 *
 * Go backwards if that's your jam.
 *
 *     var maybeNumber = getInt <=< Maybe("123") // Maybe 123
 *
 * Note to Haskell fans:
 *
 * ">>=" collides with JavaScript's "shift and assign" operator. It's not a
 * common operator, however colliding with it is probably a bad idea.
 * It's a bummer as it would be nice to match Haskell muscle memory.
 * ">=>" is unclaimed and unambigous with JavaScript's function shorthand, "=>".
 */
operator (>=>) 2 left { $l, $r } => #{ bind($r, $l) }
operator (<=<) 2 right { $l, $r } => #{ bind($l, $r) }



/**
 * Call
 * ====
 *
 * Loose associativity call. Just sugar for (callableExpression)(arg)
 */
operator ($) 1 left { $callable, $argument } => #{ ($callable)($argument) }



/**
 * Curried function
 * ================
 *
 * Define a function which is curried (see `loda.curry`).
 *
 * It would be too bold to make all functions curried. If you want that,
 * write a local macro that looks like:
 *
 *     let function = macro {
 *       case {_ $name ($params ...) {$body ...} } => {
 *         function$ $name ($params ...) {$body ...}
 *       }
 *     }
 *
 * Note: this results in a variable declaration, so `function$` is not
 * [hoisted](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Scope_Cheatsheet#Hoisting)
 * like regular functions. Be aware of this limitation when defining functions.
 */
macro function$ {
  rule { $name ($params ...) {$body ...} } => {
    var $name = curry(function $name ($params ...) {$body ...});
  }
}



export (!)
export (?:)
export (?)
export (if)
export (>=>)
export (<=<)
export (><)
export ($)
export function$
