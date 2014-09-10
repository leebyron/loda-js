/**
 * Real janky test of sweet macros.
 * From loda-js/ Run me with:
 *
 *    ./node_modules/sweet.js/bin/sjs --readable-names --module ./macros/loda.macros.js ./examples/test-macro.js | node
 *
 */

// TODO: remove this and assume ES6 environments.
macro (=>) {
  rule infix { ($params ...) | { $body ... } } => {
    function ($params ...) { $body ... }
  }
}


require('./').install(global);
var Promise = require('promise');



a = Maybe({b:Maybe({c:Maybe(3),d:function(){return 'ddd';}})});

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

// Chain can include method calls

var c = Maybe('abc');
console.log(c!); // logs "abc"
console.log(c!.toUpperCase()) // logs "ABC"

// But forcing could throw! Let's do this in a safe way:

console.log(
  bind(at('c'), bind(at('b'), a)).or('bust')
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

// And it works with raw values
console.log(
  x?.y?.z?
);

// It also works with subscripting
var cString = 'c';
console.log(
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

// And you can bind to the inner value if you like
if (var aval = a) {
  console.log(aval);
} else {
  console.log('no value to bind');
}

// Doing it again, shouldnt clobber
if (var aval = a) {
  console.log(aval);
} else {
  console.log('no value to bind');
}

// It works with other monadic values like Promise
var a = new Promise(function(resolve) { setTimeout(resolve, 1000, 'abc') });
var b = a?.toUpperCase();
console.log(b); // Promise
b.then(function (value) { console.log(value) }); // "ABC" (after a second)

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



// Let's talk about bind.


function aa(x) {
  return x + 1;
}

function$ bb(n, y) {
  return y * 2 + n;
}

var e = 1;
console.log(
  bb(10) >< aa $ e
);

1 >=> aa >=> bb(10) >=> (response) => {
  console.log("JSON Response!", response);
}

var cc = function(response) {
  console.log("JSON Response!", response);
}
cc <=< bb(10) <=< aa <=< 1