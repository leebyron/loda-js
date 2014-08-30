function defineModule(module) {
  '%MODULE%';
}

function getModule() {
  var module = {};
  defineModule(module);
  return module.exports;
}

'object' === typeof exports ?
  defineModule(module) :
  'function' === typeof define && define.amd ?
    define(getModule) :
    loda = getModule();
