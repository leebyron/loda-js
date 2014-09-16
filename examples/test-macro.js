/**
 * Real janky test of sweet macros.
 * From loda-js/ Run me with:
 *
 *    ./node_modules/sweet.js/bin/sjs --readable-names --module ./macros/loda-fn.macros.js --module ./macros/loda-algebraic.macros.js ./examples/test-macro.js | node
 *
 */

// TODO: remove this and assume ES6 environments.
macro (=>) {
  rule infix { ($params:ident (,) ...) | { $body ... } } => {
    function ($params (,) ...) { $body ... }
  }
  rule infix { ($params:ident (,) ...) | $body:expr } => {
    function ($params (,) ...) { return $body; }
  }
  rule infix { $param:ident | { $body ... } } => {
    function ($param) { $body ... }
  }
  rule infix { $param:ident | $body:expr } => {
    function ($param) { return $body; }
  }
}


require('./src/loda-fn.js');
require('./src/loda-algebraic.js');
require('./').install(global);
var Promise = require('promise');



var a = Maybe({b:Maybe({c:Maybe(3),d:function(){return 'ddd';}})});

console.log(a);

// if we want to force our way to the 3, we can do this:

console.log(
  a.get().b.get().c.get()
);

// But that's annoying. We can use the post-fix ! operator instead:

console.log(
  a!.b!.c!
);

// This new operator also works on raw values.

x = {y:{z:3}};

console.log(
  x!.y!.z!
);

var uhoh = Maybe('thisorthat');
console.log(uhoh!);
var uhoh = Maybe('thisorthat');
console.log(uhoh! && !false);

// Negate a forced chain! WHOOAAA!
console.log(
  !a!.b!.c!
);

// Chain can include method calls

var c = Maybe('abc');
console.log(c!); // logs "abc"
console.log(c!.toUpperCase()) // logs "ABC"

// But forcing could throw! Let's do this in a safe way:

console.log(
  chain(chain(a, get('b')), get('c')).or('bust')
);

// Yikes. With better syntax this time:

console.log(
  a?.b?.c.or('bust')
);

// Another way to say that (especially if we're dealing with raw values:)

console.log(
  a?.b?.c ?: 'bust'
);

// ?: works a lot like JavaScript's ||, however only checks for null rather than
// anything falsey, making it safe to use with numbers.
var num = 0;
console.log(
  num || Math.PI // maybe not what you expected.
);
console.log(
  num ?: Math.PI // hopefully closer to what you expected.
);

// This is similar to JavaScript's `||` operator, however it only falls through
// on null values instead of falsey values, making it safe to use with numbers
// and booleans.
var va = null;
var vb = false;
var vc = 0;
console.log("oops", va || 'oops'); // "oops"
console.log("oops", vb || 'oops'); // "oops"
console.log("oops", vc || 'oops'); // "oops"
console.log("oops", va ?: 'oops'); // "oops"
console.log(false,  vb ?: 'oops'); // false
console.log(0,      vc ?: 'oops'); // 0

// And it works with raw values
console.log(
  true,
  x?.y?.z?
);

// It also works with subscripting
var cString = 'c';
console.log(
  3,
  a?['b']?[cString].or('bust')
);

// And function calls
console.log(
  a?.b?.d(x)
)

// And function calls called with subscripting

console.log(
  a?.b?['deaftones'[0]](x)
)

// how about just seeing if something is a real value?

console.log(
  a?
);

// This is similar to JavaScript's boolean casting `!!`, however it only
// compares to null values rather than falsey values, making it safe to use
// with numbers and booleans.
var va = null;
var vb = false;
var vc = 0;
console.log(false, !!va); // false
console.log(false, !!vb); // false
console.log(false, !!vc); // false
console.log(false, va?); // false
console.log(true, vb?); // true
console.log(true, vc?); // true


// and in concert with chaining

console.log(
  a?.b?.c?
);

// And with regular values

console.log(
  x?.y?.z?
);

// ternaries are unaffected:

var b = 'yes';
var c = 'no';

// a ? b ? a : c : c ? b : a
console.log(
  a ? b ? c : a : c ? b : a
)

// but can be combined with value checking

var b = 'yes';
var c = 'no';

// a ? b ? a : c : c ? b : a
console.log(
  a? ? b : c
)



// A maybe value is in fact a value
if (a) {
  console.log('exists');
} else {
  console.log('doesnt exist');
}

// But asking if it exists will return a boolean
if (a?) {
  console.log('has a value');
} else {
  console.log('no value');
}

// And you can chain to the inner value if you like
if (var aval = a) {
  console.log(aval);
} else {
  console.log('no value to chain');
}

// Doing it again, shouldnt clobber
if (var aval = a) {
  console.log(aval);
} else {
  console.log('no value to chain');
}

// It works with other monadic values like Promise

var toUpperCase = decontextify(String.prototype.toUpperCase);

var a = new Promise(function(resolve) { setTimeout(resolve, 1000, 'abc') });
var b = a ==> toUpperCase;
console.log(b); // Promise
b.then(function (value) { console.log(value) }) // "ABC" (after a second)
 .catch(function (error) { console.log('Error:', error) });


// and even Array!
var a = [ 'a', 'b', 'c' ];
var b = a?.toUpperCase();
console.log(b); // [ 'A', 'B', 'C' ]

// it also works with raw values.
var a = 'abc'
var b = a?.toUpperCase();
console.log(b); // 'ABC'

// Method access can be chained
var a = 'abc';
var b = a?.toUpperCase()?.indexOf('B');
console.log(b); // 1

var x = null;
var y = x?.toUpperCase()?.indexOf('B');
console.log(y); // null



// Partial application
function whizBang(a, b, c) {
  return (a + b) * c;
}

console.log(
  9,
  whizBang@(1)@(2)@(3)()
);

console.log(
  8,
  whizBang@(1)@@(2)@(3)()
);

var whiz10And12 = whizBang@(10, 12);
console.log(
  286,
  whiz10And12(13)
);

var whizSomethingWith10And12 = whizBang@@(10, 12);
console.log(
  276,
  whizSomethingWith10And12(13)
);

// Infix map and apply

console.log(

  Maybe('volta') ?>? Maybe('johntra') ?> add,
  Maybe('johntra') ?> add ?<? Maybe('volta'),
  add <? Maybe('johntra') ?<? Maybe('volta'),
  // add?(Maybe('johntra'))??(Maybe('volta'))
  'johntravolta?'
);


// Compose a chain
console.log(
  32,
  (mul(2) <+ add(3) <+ div(10) <+ neg)(-130)
)

// Compose a chain
console.log(
  32,
  (mul(2) <+ add(3) <+ div(10) <+ neg)(-130)
)


// Let's talk about chain.


function aa(x) {
  return x + 1;
}

function@ bb(n, y) {
  return y * 2 + n;
}

var e = 1;
console.log(
  14,
  (aa +> bb(10))(e)
);


1 ==> aa ==> bb(10) ==> (response) => {
  console.log("JSON Response!", response);
};

(response) => {
  console.log("JSON Response!", response);
} <== bb(10) <== aa <== 1;




var list = $do {
  x <- [1, 2];
 [0];
  y <- [x, x];
  return [y * 2, y * 3];
}
console.log(list);


// Test with some IO-ish functions.

var getNumber = function (x) {
  return promise(function (resolve) {
    setTimeout(function () {
      resolve(x * x);
    }, 500)
  });
}

var logValue = function (x) {
  return promise(function (resolve) {
    setTimeout(function () {
      console.log(x);
      resolve(true);
    }, 500)
  });
}


// No return? `logged` is an Empty Promise.
var logged = $do {
  x <- getNumber(4);
  y <- getNumber(6);
  logValue(x + y);
}

logged.then(function (value) { console.log('empty promise?', value) })
      .catch(function (error) { console.log('Error:', error) });


// Nest away!
var logged2 = $do {
  x <- getNumber(4)
  y <- $do {
    x <- getNumber(2);
    y <- getNumber(6);
    y = x + y * 2;
    return x + y;
  }
  var q = $do {
    return getNumber(123);
  }
  qx <- q;
  logValue(x + y)
}

logged2.then(function (value) { console.log('empty promise?', value) })
       .catch(function (error) { console.log('Error:', error) });


// Deep dive into data:

var data = {
  name: 'Lee',
  friends: {
    nodes: [
      {
        name: 'John',
        birthday: {
          year: 1987
        }
      },
      {
        name: 'Brett',
        birthday: null
      }
    ]
  }
};

var birthdays = data?.friends?.nodes?['birthday']?.year;
console.log('birthdays', birthdays);

var birthdays = data?.friends?.nodes[0]?.birthday?.year;
console.log('birthdays', birthdays);


var x = null;

console.log(x?);

console.log(x? ? 'I have it' : 'no can has');


if (var sx = x) {
  console.log(sx);
} else {
  console.log('shit');
}

// Combine some operators

var q = Maybe({
  r: {
    s: function (x, y) {
      return x + y;
    }
  }
});

// Maybe a partially applied function
var qrs5 = q?.r?.s@(5);

console.log(
  15,
  // Resolve the Maybe, then partially apply 10, then call, forcefully unwrap the result to get a real number.
  qrs5?@(10)()!,
  // Or, this is safer, have a fallback value
  qrs5?@(10)() ?: 0
);


// Test promises with unit:

var pa = new Promise(function (resolve) {
  setTimeout(function () {
    resolve('foo');
  }, 500);
});

var pb = pa ?> () => Maybe.None;

console.log('pb promise?', pb);

pb.then(function (value) { console.log('promise of?', value) })
  .catch(function (error) { console.log('error of?', error) });
