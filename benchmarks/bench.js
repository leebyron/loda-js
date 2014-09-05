var runBenchmarks = require('./runner').runBenchmarks;


function makeArray(size) {
  var arr = new Array(size);
  for (var ii = 0; ii < size; ii++) {
    arr[ii] = ii;
  }
  return arr;
}

function makeObj(size) {
  var obj = {};
  for (var ii = 0; ii < size; ii++) {
    obj[''+ii] = ii;
  }
  return obj;
}

function square(x) {
  return x * x;
}


runBenchmarks({
  libraries: {
    native: {
      name: '../'
    },
    loda: {
      name: '../'
    },
    underscore: {
      version: "^1.7.0"
    },
    lazyjs: {
      version: "^0.3.2",
      name: 'lazy.js'
    },
    ramda: {
      version: '^0.4.3'
    },
  },
  tests: {

    // 'map -> array': {
    //   variants: {
    //     10: [square, makeArray(10)],
    //     100: [square, makeArray(100)],
    //     1000: [square, makeArray(1000)],
    //     10000: [square, makeArray(10000)],
    //   },
    //   native: function (_, mapper, input) {
    //     return function () {
    //       input.mapx(mapper);
    //     }
    //   },
    //   loda: function (_, mapper, input) {
    //     return function () {
    //       _.array(_.map(mapper, input))
    //     }
    //   },
    //   underscore: function (_, mapper, input) {
    //     return function () {
    //       _.map(input, mapper)
    //     }
    //   },
    //   lazyjs: function(_, mapper, input) {
    //     return function () {
    //       _(input).map(mapper).toArray()
    //     }
    //   }
    // },

    // 'map -> do': {
    //   variants: {
    //     10: [square, makeArray(10)],
    //     100: [square, makeArray(100)],
    //     1000: [square, makeArray(1000)],
    //     10000: [square, makeArray(10000)],
    //   },
    //   native: function (_, mapper, input) {
    //     return function () {
    //       input.map(mapper).forEach(Function.prototype);
    //     }
    //   },
    //   loda: function (_, mapper, input) {
    //     return function () {
    //       var iter = _.iterator(_.mapx(mapper, input));
    //       while (iter.next().done === false) {}
    //       // _.doall(Function.prototype, _.mapx(mapper, input))
    //     }
    //   },
    //   underscore: function (_, mapper, input) {
    //     return function () {
    //       _.each(_.map(input, mapper), Function.prototype)
    //     }
    //   },
    //   lazyjs: function(_, mapper, input) {
    //     return function () {
    //       _(input).map(mapper).each(Function.prototype)
    //     }
    //   }
    // },

    'map obj -> do': {
      variants: {
        10: [square, makeObj(10)],
        100: [square, makeObj(100)],
        1000: [square, makeObj(1000)],
        10000: [square, makeObj(10000)],
      },
      loda: function (_, mapper, input) {
        var valMapper = _.knit(_.id, mapper);
        return function () {
          var iter = _.iterator(_.map(valMapper, input));
          while (iter.next().done === false) {}
          // _.doall(Function.prototype, _.mapx(mapper, input))
        }
      },
      underscore: function (_, mapper, input) {
        return function () {
          _.each(_.map(input, mapper), Function.prototype)
        }
      },
      lazyjs: function(_, mapper, input) {
        return function () {
          _(input).map(mapper).each(Function.prototype)
        }
      },
      ramda: function(R, mapper, input) {
        R.mapObj(mapper, input)
        //R.forEach(Function.prototype, R.toPairs(R.mapObj(mapper, input)))
      }
    },

  }
});
