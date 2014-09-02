var async = require('async');
var benchmark = require('benchmark');
var exec = require('child_process').exec;
var pad = require('pad');

function logResult() {
  console.log(this.name);
  this.forEach(function (results) {
    console.log(
      pad(results.name, 12) + ': ' +
      pad(15, results.hz.toFixed(2)) + ' +/- ' + results.stats.rme.toFixed(2) + '% op/s'
    );
  });
}

global.requireMaybe = function (moduleName) {
  try {
    return require(moduleName);
  } catch (error) {}
  return null;
};

async.eachLimit(
  [
    [ "underscore", "^1.7.0"],
    [ "lazy.js", "^0.3.2"],
  ], 4,
  function (dep, done) {
    if (requireMaybe(dep[0])) {
      done();
    } else {
      console.log('installing', dep.join('@'));
      exec('npm install ' + dep.join('@'), done);
    }
  },
  function (err) {
    if (err) return console.error(err);

    require('./map')([10, 100, 1000, 10000, 100000]).forEach(function (suite) {
      suite.on('complete', logResult).run(true);
    });

  }
);
