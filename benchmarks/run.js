var benchmark = require('benchmark');
var pad = require('pad');

function log() {
  console.log(this.name);
  this.forEach(function (results) {
    console.log(
      pad(results.name, 30) + ': ' +
      pad(15, results.hz.toFixed(2)) + ' +/- ' + results.stats.rme.toFixed(2) + '% op/s'
    );
  });
  console.log('\n');
}

global.requireMaybe = function (moduleName) {
  try {
    return require(moduleName);
  } catch (error) {}
  return null;
};

require('./map')([10, 100, 1000, 10000, 100000]).forEach(function (suite) {
  suite.on('complete', log).run(true);
});
