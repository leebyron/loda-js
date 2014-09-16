/**
 * Composition, Currying and Partial Application
 * ---------------------------------------------
 */



/**
 * Functional composition
 * ======================
 *
 *     var h = g +> f;
 *     // h(x) equivalent to f(g(x))
 *
 */
operator (+>) 8 left { $l, $r } => #{ compose($r, $l) }
operator (<+) 8 right { $l, $r } => #{ compose($l, $r) }



/**
 * Curried function
 * ================
 *
 * Define a function which is curried. See `loda-fn.curry`.
 *
 *     function@ curriedAdd(v1, v2) {
 *       return v1 + v2;
 *     }
 *     curriedAdd(1)()()(2) // 3
 *
 *
 * It would be too bold to make all functions curried. If you want that,
 * write a local macro that looks like:
 *
 *     let function = macro {
 *       case {_ $name ($params ...) {$body ...} } => {
 *         function@ $name ($params ...) {$body ...}
 *       }
 *     }
 *
 * Note: this results in a variable declaration, so `function@` is not
 * [hoisted](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Scope_Cheatsheet#Hoisting)
 * like regular functions. Be aware of this limitation when defining
 * curried functions.
 */
macro (function@@) {
  rule { $name ($params ...) {$body ...} } => {
    var $name = curryRight(function $name ($params ...) {$body ...});
  }
}

macro (function@) {
  rule { $name ($params ...) {$body ...} } => {
    var $name = curry(function $name ($params ...) {$body ...});
  }
}



/**
 * Partially apply functions
 * =========================
 *
 * Partially apply arguments to a function in a form that looks like a function
 * call. See `loda-fn.partial`.
 *
 * `@add(1)(2)` is shorthand for `add(1, 2)`
 *
 * `@@add(1)(2)` is shorthand for `add(2, 1)`
 *
 */
macro (@@) {
  rule infix { $name:expr | ( ) } => {
    $name
  }
  rule infix { $name:expr | ( $args ... ) } => {
    partialRight($name, $args ...)
  }
  rule {}
}

macro (@) {
  rule infix { $name:expr | ( ) } => {
    $name
  }
  rule infix { $name:expr | ( $args ... ) } => {
    partial($name, $args ...)
  }
  rule {}
}



// Compose
export (+>)
export (<+)

// Curry
export (function@)
export (function@@)

// Partial
export (@)
export (@@)
