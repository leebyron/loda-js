/**
 * Macros
 * ------
 *
 * Loda provides sweet.js macros to greatly ease developing in an
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

  // a! => getValue(a)
  rule infix { $maybe:expr | } => {
    getValue($maybe)
  }
}



/**
 * Unwrapping Maybe with Fallback
 * ==============================
 *
 * Use `?:` to get a value from a Maybe, with a fallback value should the Maybe
 * be without a value.
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
 * This is similar to JavaScript's `||` operator, however it only falls through
 * on null values instead of falsey values, making it safe to use with numbers
 * and booleans.
 *
 *     var a = null;
 *     var b = false;
 *     var c = 0;
 *     console.log(a || 'oops'); // "oops"
 *     console.log(b || 'oops'); // "oops"
 *     console.log(c || 'oops'); // "oops"
 *     console.log(a ?: 'oops'); // "oops"
 *     console.log(b ?: 'oops'); // false
 *     console.log(c ?: 'oops'); // 0
 *
 */
operator (?:) 6 left { $maybe, $otherwise } => #{
  valueOr($maybe, $otherwise)
}



/**
 * Lifting Maybe
 * =============
 *
 * Lifting a monadic value into a function from with `?>`.
 *
 * Read `?>` as "If a value, then pass to function."
 *
 *     var double = x => x + x;
 *     var a = Maybe(10);
 *     var b = a ?> v => double(v);
 *
 * Or, since double takes one value:
 *
 *     var b = a ?> double;
 *
 */
operator (?>) 7 left { $maybe, $fn } => #{
  map($maybe, $fn)
}
operator (<?) 7 right { $fn, $maybe } => #{
  map($maybe, $fn)
}



/**
 * Applying Maybe
 * ==============
 *
 * Applying a monadic function to a monadic value with `?>?`.
 *
 * Read `?>?` as "If this function and if that value, then pass value to function."
 *
 *     var double = x => x + x;
 *     var d = Maybe(double);
 *     var a = Maybe(10);
 *     var b = a ?>? d;
 *
 */
operator (?>?) 6 right { $appval, $appfn } => #{
  apply($appfn, $appval)
}
operator (?<?) 6 left { $appfn, $appval } => #{
  apply($appfn, $appval)
}



// Property Access and Method Call chaining of Monadic values.
// The `?` operator is used in a couple different ways, depending on context.
// The order of rules in this macro is significant.
macro (?) {

  // Allow use of value? in ternaries, see below.
  rule infix { $maybe:expr | $[?] $then:expr : $otherwise:expr } => {
    isValue($maybe) $[?] $then : $otherwise
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
   * Given a monadic value, such as Maybe or Promise, map a property access or
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
   *     console.log(b); // Maybe "ABC"
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
  // a?(x) => map(a, function(v){return v(x);})
  // a?.b => map(a, function(v){return v.b;})
  // a?[b] => map(a, function(v){return v[b];})
  // a?.b(x) => map(a, function(v){return v.b(x);})
  // a?[b](x) => map(a, function(v){return v[b](x);})
  rule infix { $monad:expr | $access:accessChain } => {
    map($monad, function (v) { return v $access; })
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
  // a? => isValue(a)
  rule infix { $maybe:expr | } => {
    isValue($maybe)
  }
}

macro accessChain {
  rule { $access:access $rest:access ... = $assignment:expr }
  rule { $access:access $rest:access ... += $assignment:expr }
  rule { $access:access $rest:access ... -= $assignment:expr }
  rule { $access:access $rest:access ... *= $assignment:expr }
  // rule { $access:access $rest:access ... /= $assignment:expr } // bug in sweet.js
  rule { $access:access $rest:access ... %= $assignment:expr }
  rule { $access:access $rest:access ... <<= $assignment:expr }
  rule { $access:access $rest:access ... >>= $assignment:expr }
  rule { $access:access $rest:access ... >>>= $assignment:expr }
  rule { $access:access $rest:access ... &= $assignment:expr }
  rule { $access:access $rest:access ... ^= $assignment:expr }
  rule { $access:access $rest:access ... |= $assignment:expr }
  rule { $access:access $rest:access ... ++ }
  rule { $access:access $rest:access ... -- }
  rule { $access:access $rest:access ... }
}

macro access {
  rule { @( $args:expr ... ) }
  rule { ( $args:expr ... ) }
  rule { . $name:ident }
  rule { [ $name:expr ] }
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
  rule { ( $assign:assignment $maybe:expr ) { $body ... } } => {
    var maybe;
    if ((maybe = $maybe), maybe?) {
      $assign maybe!;
      $body ...
    }
  }
  // Default, don't mess with regular if statements
  rule {} => { if }
}

let while = macro {
  // while (var x = maybe) {...} => while (maybe?) {var x = maybe! ...}
  rule { ( $assign:assignment $maybe:expr ) { $body ... } } => {
    var maybe;
    while ((maybe = $maybe), maybe?) {
      $assign maybe!;
      $body ...
    }
  }
  // Default, don't mess with regular while statements
  rule {} => { while }
}

let for = macro {
  // while (var x = maybe) {...} => while (maybe?) {var x = maybe! ...}
  rule { ( $init:expr ; $assign:assignment ; $fin:expr ) { $body ... } } => {
    var maybe;
    for ($init; (maybe = $maybe), maybe?; $fin) {
      $assign maybe!;
      $body ...
    }
  }
  // Default, don't mess with regular for statements
  rule {} => { for }
}

macro assignment {
  rule { var $name:ident = }
  rule { let $name:ident = }
  rule { $name:ident = }
}





/**
 * Monadic chain
 * =============
 *
 * Binds the right function to the left monadic value.
 *
 *     var getInt = parseInt +> Maybe;
 *     var maybeNumber = Maybe("123") ==> getInt // Maybe 123
 *
 * Go backwards if that's your jam.
 *
 *     var maybeNumber = getInt <== Maybe("123") // Maybe 123
 *
 * Note to Haskell fans:
 *
 * ">>=" collides with JavaScript's "shift and assign" operator. It's not a
 * common operator, however colliding with it is probably a bad idea.
 * It's a bummer as it would be nice to match Haskell muscle memory.
 */
operator (==>) 6 left { $l, $r } => #{ chain($l, $r) }
operator (<==) 6 right { $l, $r } => #{ chain($r, $l) }



// Map
export (?>)
export (<?)
// ?.

// Apply
export (?>?)
export (?<?)

// Chain
export (==>)
export (<==)

// Maybe
export (!)
export (?:)
export (?)
export (if)
export (while)
export (for)
