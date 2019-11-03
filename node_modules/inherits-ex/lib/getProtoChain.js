(function() {
  var getProtoChain, getPrototypeOf, objectSuperCtor;

  getPrototypeOf = require('./getPrototypeOf');

  objectSuperCtor = getPrototypeOf(Object);

  module.exports = getProtoChain = function(ctor, deepth) {
    var lastCtor, mctors, name, result;
    if (deepth == null) {
      deepth = 0;
    }
    if (deepth >= getProtoChain.maxDeepth) {
      throw new Error('The maximum depth of nesting is reached.');
    }
    result = (function() {
      var results;
      results = [];
      while (ctor && ctor !== objectSuperCtor) {
        if (lastCtor && (mctors = lastCtor.mixinCtors_)) {
          mctors = mctors.map(function(m) {
            return getProtoChain(m, ++deepth);
          });
          name = mctors;
        } else {
          if (ctor === Object) {
            name = "Base";
          } else {
            name = ctor.name;
          }
        }
        lastCtor = ctor;
        ctor = (ctor.hasOwnProperty('super_') && ctor.super_) || getPrototypeOf(ctor);
        results.push(name);
      }
      return results;
    })();
    return result.reverse();
  };

  getProtoChain.maxDeepth = 10;

}).call(this);

//# sourceMappingURL=getProtoChain.js.map
