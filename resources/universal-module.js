/* global module, define, loda: true */

function universalModule(module) { module = module || {}

  "%MODULE%"

  return module.exports;
}

typeof module === 'object' ? universalModule(module) :
  typeof define === 'function' && define.amd ? define(universalModule) :
    loda = universalModule();
