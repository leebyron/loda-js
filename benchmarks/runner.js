var benchmark = require('benchmark');
var child = require('child_process');
var pad = require('pad');
var Promise = require('promise');
var _ = require('../');

var exec = Promise.denodeify(child.exec);

function runBenchmarks(config) {
  return _.bind(
    _.compose(
      _.doall(console.log),
      _.bind(_.map(testResult)),
      mapTestSuites(config.tests)
    ),
    getLibraries(config.libraries)
  )
}

// TODO: convert to Promise
function testResult(test) {
  return test.name + '\n' +
    _.string(_.map(function (testResult) {
      return pad(testResult.name, 12) + ': ' +
        pad(15, testResult.hz.toFixed(2)) +
        ' +/- ' + testResult.stats.rme.toFixed(2) + '% op/s\n'
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
    if (module.is()) {
      return _.pure(Promise, module);
    } else {
      var npmName = dep.name + '@' + dep.version;
      return _.bind(function (lols) {
        return requireMaybe(dep.name);
      }, exec('npm install ' + npmName));
    }
  }, normalizeLibInfo(libInfo));
}

var requireMaybe = _.Maybe.try(require);

var mapTestSuites = _.curry(function (tests, libs) {
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
