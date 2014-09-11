function universalModule(module, undefined) { module = module || {}
  "MODULE"
return module.exports; }

typeof module === 'object' ? universalModule(module) :
  typeof define === 'function' && define.amd ? define(universalModule) :
    LIBNAME = universalModule();
