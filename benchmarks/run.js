var runBenchmarks = require('./runner').runBenchmarks;


function makeArray(size) {
  var arr = new Array(size);
  for (var ii = 0; ii < size; ii++) {
    arr[ii] = ii;
  }
  return arr;
}

function square(x) {
  return x * x;
}


runBenchmarks({
  libraries: {
    native: {
      name: '../',
    },
    loda: {
      name: '../',
    },
    underscore: {
      version: "^1.7.0"
    },
    lazyjs: {
      version: "^0.3.2",
      name: 'lazy.js',
    }
  },
  tests: {

    'map -> array': {
      variants: {
        10: [square, makeArray(10)],
        100: [square, makeArray(100)],
        1000: [square, makeArray(1000)],
        10000: [square, makeArray(10000)],
      },
      native: function (_, mapper, input) {
        return function () {
          input.map(mapper);
        }
      },
      loda: function (_, mapper, input) {
        return function () {
          _.array(_.map(mapper, input))
        }
      },
      underscore: function (_, mapper, input) {
        return function () {
          _.map(input, mapper)
        }
      },
      lazyjs: function(_, mapper, input) {
        return function () {
          _(input).map(mapper).toArray()
        }
      }
    },

    'map -> do': {
      variants: {
        10: [square, makeArray(10)],
        100: [square, makeArray(100)],
        1000: [square, makeArray(1000)],
        10000: [square, makeArray(10000)],
      },
      native: function (_, mapper, input) {
        return function () {
          input.map(mapper).forEach(Function.prototype);
        }
      },
      loda: function (_, mapper, input) {
        return function () {
          _.doall(Function.prototype, _.map(mapper, input))
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
      }
    }

  }
});
