var async = require('async');
var benchmark = require('benchmark');
var exec = require('child_process').exec;
var pad = require('pad');
var _ = require('../');

function runBenchmarks(config) {
  getLibraries(config.libraries, function (libs) {
    _.doall(
      console.log,
      _.flatten(
        _.map(
          _.map(testResult),
          mapTestSuites(libs, config.tests))));
  });
}

function testResult(test) {
  return test.name + '\n' +
    _.string(_.map(function (testResult) {
      return pad(testResult.name, 12) + ': ' +
        pad(15, testResult.hz.toFixed(2)) +
        ' +/- ' + testResult.stats.rme.toFixed(2) + '% op/s\n'
    }, test.run()));
}

function getLibraries(libInfo, withLibs) {
  async.map(
    _.array(_.map(function (lib) {
      return {
        key: lib[0],
        name: lib[1].name || lib[0],
        version: lib[1].version
      }
    }, libInfo)),
    function (dep, done) {
      var module = requireMaybe(dep.name);
      if (module) {
        done(null, {
          key: dep.key,
          module: module
        });
      } else {
        var npmName = dep.name + '@' + dep.version;
        console.log('installing', npmName);
        exec('npm install ' + npmName, function () {
          done(null, {
            key: dep.key,
            module: requireMaybe(dep.name)
          });
        })
      }
    },
    function (err, result) {
      withLibs(
        _.object(
          _.filter(_.get(1),
            _.map(
              _.juxt(_.get('key'), _.get('module')),
              result))));
    }
  );
}

function requireMaybe(moduleName) {
  try {
    return require(moduleName);
  } catch (error) {}
  return null;
}

function mapTestSuites(libs, tests) {
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
}

exports.runBenchmarks = runBenchmarks;
