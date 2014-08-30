require('./loda').install(global);


// var testBound = bound(function(x, y, z) {
//   console.log(this, x, y, z, arguments);
// })

// console.log(
//   testBound(1, 2, 3, 4, 5, 6, 7, {foo:'bar'})
// )


// console.log(
//   array(map(add, [1,2,3], [10,20,30]))
// )

// console.log(
//   object(zip(
//     map(add, [1,2,3], [10,20,30]),
//     map(add, [2,4,6], [20,40,60])
//   ))
// )

// var mappedSum = map(add, [1,2,3], [10,20,30]);
// console.log(
//   object(zip(
//     mappedSum,mappedSum
//   ))
// )


// var sum = add;
// var curriedFive = curry(sum, 5);

// console.log(
//   curriedFive(1)(2,3)()(4)(5)
// );

// console.log(
//   curriedFive(1)()()()(2,3,4)()(5,6,7)
// );



// console.log(
//   compose(partial(mul, 2), partial(add, 5), partial(mul, 2))(10)
// )




// var isOdd = mod(2);
// var isEven = complement(mod(2));

// console.log(
//   array(filter(isOdd, [1,2,3,4,5,6,7,8,9]))
// )

// console.log(
//   array(filter(isEven, [1,2,3,4,5,6,7,8,9]))
// )

// console.log(
//   reduce(add, 10, filter(isOdd, [1,2,3,4,5,6,7,8,9]))
// )

// console.log(
//   count(filter(isOdd, [1,2,3,4,5,6,7,8,9]))
// )

// console.log(
//   array(filter(partial(is, 3), [1,2,3,1,2,3,1,2,3]))
// )

// console.log(
//   string(map(bound(String.prototype.toUpperCase), 'hello'))
// )


// var memoSum = memo(function(){
//   console.log('called:', arguments);
//   return reduce(add, arguments);
// });

// console.log(memoSum());
// console.log(memoSum());
// console.log(memoSum(1));
// console.log(memoSum(1));
// console.log(memoSum(1,2));
// console.log(memoSum(1,2));
// console.log(memoSum(2,1));
// console.log(memoSum(2,1));
// clear(memoSum);
// console.log(memoSum(1,2));


// console.log(add(1,2))
// console.log(add(1,2,3))
// console.log(add(1,2,3,4))
// console.log(add(1,2,3,4,5))


// console.log('string'.split(''));
// console.log(apply(add, 'string'.split('')))



var ai;
ai = iterator(function() {
  var x;
  x = 1;
  return function() {
    console.log('wat');
    return {
      value: x++,
      done: false
    };
  };
});
console.log(ai.next().value)
console.log(ai.next().value)
console.log(ai.next().value)
