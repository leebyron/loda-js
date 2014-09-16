var benchmark = require('benchmark');
var child = require('child_process');
var pad = require('pad');
var Promise = require('promise');
require('../src/loda-fn.js');
require('../src/loda-core.js');
var _ = require('../');

var exec = Promise.denodeify(child.exec);

function runBenchmarks(config) {
  return chain(
    getLibraries(config.libraries),
    compose(
      _.doall(console.log),
      _.mapCat(_.map(testResult)), // TODO: make chain work for lazy iterables
      mapTestSuites(config.tests)
    )
  )
}

// TODO: convert to Promise
function testResult(test) {
  return test.name + '\n' +
    _.string(_.map(function (result) {
      return pad(result.name, 12) + ': ' +
        pad(15, result.hz.toFixed(2)) +
        ' +/- ' + result.stats.rme.toFixed(2) + '% op/s\n'
    }, test.run()));
}

function normalizeLibInfo(libInfo) {
  return _.map(function (lib) {
    return [lib[0], {
      name: lib[1].name || lib[0],
      version: lib[1].version
    }]
  }, libInfo);
}

function getLibraries(libInfo) {
  return _.mapValM(function (dep) {
    var module = requireMaybe(dep.name);
    if (module.isValue()) {
      return unit(Promise, module);
    } else {
      var npmName = dep.name + '@' + dep.version;
      return chain(exec('npm install ' + npmName), function (lols) {
        return requireMaybe(dep.name);
      });
    }
  }, normalizeLibInfo(libInfo));
}

var requireMaybe = _.Maybe.try(require);

var mapTestSuites = curry(function (tests, libs) {
  return _.map(function (test) {
    var testName = test[0];
    var testDetail = test[1];
    return _.map(function (variant) {
      var variantName = variant[0];
      var variantArgs = variant[1];
      return _.reduce(function (suite, lib) {
        var libName = lib[0];
        var libModule = lib[1];
        var libTest = testDetail[libName];
        libTest && suite.add(
          libName,
          _.apply(libTest, [libModule].concat(variantArgs))
        );
        return suite;
      }, new benchmark.Suite(testName + ' ' + variantName), libs);
    }, testDetail.variants || {'': []})
  }, tests);
});

exports.runBenchmarks = runBenchmarks;
