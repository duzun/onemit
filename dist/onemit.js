/*
 MIT
   @version 2.0.3
   @repo    https://github.com/duzun/onemit
*/
(function(name, global, undefined) {
  var UNDEFINED = undefined + "";
  var hop = {}.hasOwnProperty;
  var slice = [].slice;
  var splice = [].splice;
  var bind = hop.bind;
  var _setTimeout = typeof setTimeout != UNDEFINED ? setTimeout : global.setTimeout;
  var _setImmediate = typeof setImmediate != UNDEFINED ? setImmediate : global.setImmediate;
  var _Promise = typeof Promise != UNDEFINED ? Promise : global.Promise;
  var _timersInited;
  (typeof define !== "function" || !define.amd ? typeof module != UNDEFINED && module.exports ? function(deps, factory) {
    module.exports = factory();
  } : function(deps, factory) {
    global[name] = factory();
  } : define)([], function factory() {
    function OnEmit(obj) {
      if (obj) {
        return _extend(obj, OnEmit.prototype);
      }
    }
    function EmitEvent(props) {
      var event = this;
      if (!(event instanceof EmitEvent)) {
        return new EmitEvent(props);
      }
      if (props == undefined) {
        props = "";
      }
      if (typeof props == "string") {
        props = {type:props};
      }
      _extend(event, props);
      event.timeStamp = Date.now();
    }
    _extend(EmitEvent.prototype, {type:"*", toString:function() {
      return this.type;
    }});
    _extend(OnEmit.prototype, {on:function(event, fn) {
      var _list = _listeners.call(this, event, true);
      _list.push(fn);
      return this;
    }, only:function(event, fn) {
      var _list = _listeners.call(this, event, true);
      if (_list.indexOf(fn) < 0) {
        _list.push(fn);
      }
      return this;
    }, once:function(event, fn) {
      function _fn() {
        this.off(event, _fn);
        fn.apply(this, arguments);
      }
      _fn.fn = fn;
      return this.on(event, _fn);
    }, off:function(event, fn) {
      var _callbacks = this._callbacks;
      if (!_callbacks) {
        return this;
      }
      if (0 == arguments.length) {
        if (_callbacks) {
          this._callbacks = {};
        }
        return this;
      }
      var _list = _callbacks[event];
      if (!_list) {
        return this;
      }
      if (1 == arguments.length) {
        delete _callbacks[event];
        return this;
      }
      var _cb;
      for (var i = _list.length; i--;) {
        _cb = _list[i];
        if (_cb === fn || _cb.fn === fn) {
          splice.call(_list, i, 1);
        }
      }
      return this;
    }, emit:function(event, arg1, arg2) {
      var _self = this;
      var _ret = [];
      var _event = new EmitEvent(event);
      _event.result = _ret;
      var _callbacks, _all;
      if (!(_callbacks = _self._callbacks)) {
        return _event;
      }
      var _type = _event.type;
      var _list = _callbacks[_type];
      var _any = _callbacks["*"];
      if (_list && _list.length) {
        if (_any && _any.length) {
          _all = _list.concat(_any);
        } else {
          _all = slice.call(_list, 0);
        }
      } else {
        if (_any && _any.length) {
          _all = slice.call(_any, 0);
        } else {
          return _event;
        }
      }
      var args = slice.call(arguments, 0);
      args[0] = _event;
      for (var i = 0, len = _all.length; i < len; ++i) {
        var r = _all[i].apply(_self, args);
        if (r !== undefined) {
          _ret.push(r);
        }
      }
      return _event;
    }, emitAfter:function(delay, event, arg1, arg2) {
      var Promise = OnEmit.Promise || _Promise;
      var _self = this;
      var _ret = [];
      var i = +(typeof delay == "number");
      var _event = new EmitEvent(arguments[i]);
      _event.result = _ret;
      var _callbacks, _all;
      if (!(_callbacks = _self._callbacks)) {
        return Promise.resolve(_event);
      }
      var _type = _event.type;
      var _list = _callbacks[_type];
      var _any = _callbacks["*"];
      if (_list && _list.length) {
        if (_any && _any.length) {
          _all = _list.concat(_any);
        } else {
          _all = _list;
        }
      } else {
        if (_any && _any.length) {
          _all = _any;
        } else {
          return Promise.resolve(_event);
        }
      }
      var len = _all.length;
      var args = slice.call(arguments, i);
      args[0] = _event;
      if (!i) {
        delay = 0;
      } else {
        i = 0;
      }
      for (; i < len; ++i) {
        _ret[i] = PromiseTimeout.call(_self, _all[i], args, delay);
      }
      return Promise.all(_ret).then(function(result) {
        _event.result = result;
        return _event;
      });
    }, emitAsync:function(event, arg1, arg2) {
      var Promise = OnEmit.Promise || _Promise;
      var _self = this;
      var _event = new EmitEvent(event);
      var _ret = [];
      _event.result = _ret;
      var _callbacks, _all;
      if (!(_callbacks = _self._callbacks)) {
        return Promise.resolve(_event);
      }
      var _type = _event;
      var _list = _callbacks[_type];
      var _any = _callbacks["*"];
      if (_list && _list.length) {
        if (_any && _any.length) {
          _all = _list.concat(_any);
        } else {
          _all = _list;
        }
      } else {
        if (_any && _any.length) {
          _all = _any;
        } else {
          return Promise.resolve(_event);
        }
      }
      var len = _all.length;
      var args = slice.call(arguments, 0);
      args[0] = _event;
      for (var i = 0; i < len; ++i) {
        _ret[i] = PromiseTimeout.call(_self, _all[i], args);
      }
      return Promise.all(_ret).then(function(result) {
        _event.result = result;
        return _event;
      });
    }, bind:function(obj) {
      var proto = OnEmit.prototype;
      var _self = this;
      for (var key in proto) {
        if (hop.call(proto, key) && "function" == typeof proto[key]) {
          obj[key] = bind.call(proto[key], _self);
        }
      }
      return obj;
    }, hasListeners:function(event) {
      var _list = _listeners.call(this, event, false);
      return !!(_list && _list.length);
    }, hasListener:function(event, fn) {
      if (!fn && event) {
        fn = event;
        event = "*";
      }
      var _list;
      if (event != "*") {
        _list = _listeners.call(this, event, false);
        return !!(_list && ~_list.indexOf(fn));
      } else {
        _list = this._callbacks;
        for (var key in _list) {
          if (hop.call(_list, key)) {
            if (_list[key].indexOf(fn) > -1) {
              return true;
            }
          }
        }
      }
      return false;
    }, listeners:_listeners});
    function _listeners(event, addMode) {
      var _callbacks = this._callbacks || (this._callbacks = {});
      var _type = event.type || String(event);
      var _list = _callbacks[_type] || addMode && (_callbacks[_type] = []) || [];
      return _list;
    }
    OnEmit.Event = EmitEvent;
    function PromiseTimeout(fn, args, delay) {
      var Promise = OnEmit.Promise || _Promise;
      var that = this;
      delay = +delay;
      var timeoutFn = getTimeoutFn(delay);
      return new Promise(function(resolve, reject) {
        timeoutFn(function() {
          try {
            resolve(fn.apply(that, args));
          } catch (err) {
            reject(err);
          }
        }, delay);
      });
    }
    function getTimeoutFn(delay) {
      var timeoutFn = delay ? OnEmit.setTimeout || _setTimeout : OnEmit.setImmediate || _setImmediate;
      if (!timeoutFn) {
        if (!_timersInited) {
          if (_initTimers()) {
            return getTimeoutFn(delay);
          }
        }
        if (!delay) {
          return getTimeoutFn(1);
        }
      }
      return timeoutFn;
    }
    return OnEmit;
  });
  function _extend(obj, from) {
    for (var key in from) {
      if (hop.call(from, key)) {
        obj[key] = from[key];
      }
    }
    return obj;
  }
  function _append(array, args) {
    var i = array.length, j, k = 1, l, m = arguments.length, a;
    for (; k < m; ++k) {
      a = arguments[k];
      array.length = l = i + a.length;
      for (j = 0; i < l; ++i, ++j) {
        array[i] = a[j];
      }
    }
    return array;
  }
  if ("function" != typeof bind) {
    bind = function(oThis) {
      var fArgs = slice.call(arguments, 1), fToBind = this, fNOP = function() {
      }, fBound = fArgs.length ? function() {
        var aArgs = arguments;
        return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.length ? _append(fArgs, aArgs) : fArgs);
      } : function() {
        return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, arguments);
      };
      fNOP.prototype = fToBind.prototype;
      fBound.prototype = new fNOP;
      return fBound;
    };
  }
  function _initTimers() {
    if (_timersInited) {
      return _timersInited;
    }
    _timersInited = global;
    if ("function" != typeof _setTimeout) {
      if ("function" == typeof "require") {
        var TIMERS = require("sdk/timers");
        _timersInited = TIMERS;
        _setTimeout = TIMERS.setTimeout;
        if (!_setImmediate) {
          _setImmediate = TIMERS.setImmediate;
        }
      }
    }
    return _timersInited;
  }
})("OnEmit", typeof globalThis == "undefined" ? typeof global == "undefined" ? self : global : globalThis);

