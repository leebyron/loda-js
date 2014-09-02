var benchmark = require('benchmark');
var loda = require('../');
var underscore = requireMaybe('underscore');
var lazyjs = requireMaybe('lazy.js');


function lodaMap(input, mapper) {
  return function() {
    loda.array(loda.map(mapper, input));
  }
}

function underscoreMap(input, mapper) {
  return function() {
    underscore.map(input, mapper);
  }
}

function lazyjsMap(input, mapper) {
  return function() {
    lazyjs(input).map(mapper).toArray();
  }
}


function makeArray(size) {
  var arr = new Array(size);
  for (var ii = 0; ii < size; ii++) {
    arr[ii] = ii;
  }
  return arr;
}

module.exports = function (sizes) {
  return sizes.map(function (size) {
    var input = makeArray(size);
    var mapper = function (x) { return x * x };

    var suite = new benchmark.Suite('Map (' + size + ')');
    loda && suite.add('loda', lodaMap(input, mapper))
    underscore && suite.add('underscore', underscoreMap(input, mapper))
    lazyjs && suite.add('lazy', lazyjsMap(input, mapper))
    return suite
  });
};
