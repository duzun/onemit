(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.OnEmit = factory());
}(this, (function () { 'use strict';

    /**
     *   Event emitter for JS.
     *
     *   Inspired by https://github.com/component/emitter
     *
     *   @author  Dumitru Uzun (DUzun.Me)
     *   @license MIT
     *   @version 2.2.0
     *   @repo    https://github.com/duzun/onemit
     */

    /*   Usage:
     *
     *      OnEmit(obj);
     *          The `OnEmit` may also be used as a mixin.
     *          For example a "plain" object may become an emitter,
     *          or you may extend an existing prototype.
     *
     *
     *      As an `OnEmit` instance:
     *          var OnEmit = require('emitter');
     *          var emitter = new OnEmit;
     *          emitter.on('anything', function (eventName, obj, str, num) { ... })
     *          emitter.emit('anything', {"with": "any arguments"}, "variable number", 123);
     *          emitter.off('anything');
     *
     *
     *      As a mixin:
     *          var OnEmit = require('emitter');
     *          var user = { name: 'dima' };
     *          OnEmit(user);
     *          user.emit('im a user');
     *
     *
     *      As a prototype mixin:
     *          var OnEmit = require('emitter');
     *          OnEmit(User.prototype);
     *
     *
     *      OnEmit.on(event, fn)
     *          Register an `event` handler `fn`.
     *
     *      OnEmit.only(event, fn)
     *          Register an `event` handler `fn` only once.
     *
     *      OnEmit.once(event, fn)
     *          Register a single-shot `event` handler `fn`,
     *          removed immediately after it is invoked the first time.
     *
     *      OnEmit.when(event): Promise
     *          Similar to .once(event, fn), only returns a promise.
     *
     *      OnEmit.off(event, fn)
     *          * Pass `event` and `fn` to remove a listener.
     *          * Pass `event` to remove all listeners on that event.
     *          * Pass nothing to remove all listeners on all events.
     *
     *      OnEmit.emit(event, ...)
     *          Emit an `event` with variable option args.
     *
     *      OnEmit.emitAfter(delay, event, ...)
     *          Emit an `event` with variable option args after `delay` milliseconds.
     *
     *      OnEmit.listeners(event)
     *          Return an array of callbacks, or an empty array.
     *
     *      OnEmit.hasListeners(event)
     *          Check if this emitter has `event` handlers.
     *
     *      Note: The special event `*` listens on all events.
     *          Eg. OnEmit.on('*', fn);
     *              OnEmit.emit('foo'); // -> fn('foo')
     *              OnEmit.emit('bar'); // -> fn('bar')
     *
     */

    /*jshint browser: true, node: true*/
    var root = typeof globalThis == 'undefined' ? typeof global == 'undefined' ? self : global : globalThis; // Native methods

    var hop = {}.hasOwnProperty;
    var _bind = hop.bind;
    var _ref = [],
        slice = _ref.slice,
        splice = _ref.splice;

    var _Promise = typeof Promise != 'undefined' ? Promise : root.Promise;

    var TIMERS = typeof self !== 'undefined' && isFunction(self.setTimeout) ? self : root;

    if (!isFunction(TIMERS.setTimeout)) {
      if (typeof require !== 'undefined') {
        // Firefox Addon
        TIMERS = require('sdk/timers');
      }
    }

    var _TIMERS = TIMERS,
        setTimeout = _TIMERS.setTimeout,
        setImmediate = _TIMERS.setImmediate;
    /**
     * Initialize a new `OnEmit`.
     *
     */

    function OnEmit(obj) {
      if (obj) return _extend(obj, OnEmit.prototype);
    }
    /**
     * Event constructor.
     *
     * @param (Object) props - { type: "eventName", ... } or just "eventName"
     */

    function EmitEvent(props) {
      var event = this;

      if (!(event instanceof EmitEvent)) {
        return new EmitEvent(props);
      }

      if (props == undefined) {
        props = '';
      }

      if (typeof props == 'string') {
        props = {
          type: props
        };
      }

      _extend(event, props);

      event.timeStamp = Date.now();
    }

    _extend(EmitEvent.prototype, {
      type: '*',
      toString: function toString() {
        return this.type;
      }
    });

    _extend(OnEmit.prototype, {
      /**
       *  Listen on the given `event` with `fn`.
       *
       *  @param  (String)   name  - event name
       *  @param  (Function) fn    - event handler
       *  @return (OnEmit)
       */
      on: function on(event, fn) {
        var _list = _listeners.call(this, event, true);

        _list.push(fn);

        return this;
      },

      /**
       *  Listen on the given `event` with `fn`
       *  only if not already listening.
       *
       *  @param  (String)   name  - event name
       *  @param  (Function) fn    - event handler
       *  @return (OnEmit)
       */
      only: function only(event, fn) {
        var _list = _listeners.call(this, event, true);

        if (_list.indexOf(fn) < 0) {
          _list.push(fn);
        }

        return this;
      },

      /**
       * Adds an `event` listener that will be invoked only once.
       *
       * @param  (String)   event
       * @param  (Function) fn
       * @return (OnEmit)
       */
      once: function once(event, fn, _never) {
        function _fn() {
          delete _fn.never;
          this.off(event, _fn);
          fn.apply(this, arguments);
        }

        _fn.fn = fn;
        if (_never) _fn.never = _never;
        return this.on(event, _fn);
      },

      /**
       * Wait for `event` with a Promise.
       *
       * @param  (String)   event
       * @return (Promise)
       */
      when: function when(event, timeout) {
        var self = this;
        var Promise = OnEmit.Promise || _Promise;
        return new Promise(function (resolve, reject) {
          var on = function on(event) {
            for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
              args[_key - 1] = arguments[_key];
            }

            event.args = args;
            resolve(event);
            reject = undefined;
          };

          self.once(event, on, reject);
          if (timeout = +timeout) getTimeoutFn(timeout)(function () {
            if (!reject) return;
            var error = new Error("OnEmit.when(".concat(event, ") timeout after ").concat(timeout));
            error.type = 'timeout';
            reject(error);
            self.off(event, on);
          }, timeout);
        });
      },

      /**
       * Remove the given callback for `event` or all
       * registered callbacks.
       *
       * @param  (String)   event - event name    - optional
       * @param  (Function) fn    - event handler - optional
       * @return (OnEmit)
       *
       *  Usage:
       *     .off(name, hdl) - remove the hdl from event name
       *     .off(name)      - remove all listeners for event name
       *     .off()          - remove all listeners for all events
       *
       */
      off: function off(event, fn) {
        var _this = this;

        var _callbacks = this._callbacks; // No handlers, return quickly

        if (!_callbacks) return this; // remove all handlers

        if (0 == arguments.length) {
          if (_callbacks) {
            for (event in _callbacks) {
              if (hop.call(_callbacks, event)) {
                this.off(event);
              }
            }

            this._callbacks = {};
          }

          return this;
        } // specific event:


        var _list = _callbacks[event];
        if (!_list) return this;
        var neverList = []; // remove all handlers

        if (1 == arguments.length) {
          delete _callbacks[event];

          for (var i = _list.length; i--;) {
            if (_list[i]) {
              var never = _list[i].never;
              if (never) neverList.push(never);
            }
          }
        } else {
          // remove specific handler
          for (var _i = _list.length; _i--;) {
            var _cb = _list[_i];

            if (_cb === fn || _cb.fn === fn) {
              var _never2 = _cb.never;
              if (_never2) neverList.push(_never2);
              splice.call(_list, _i, 1);
            }
          }
        }

        var neverListLength = neverList.length;

        if (neverListLength) {
          var timeoutFn = getTimeoutFn();
          timeoutFn(function () {
            for (var _i2 = 0; _i2 < neverListLength; ++_i2) {
              var _never3 = neverList[_i2];
              if (_never3) _never3.call(_this, event);
            }
          });
        }

        return this;
      },

      /**
       * Emit `event` with the given args.
       *
       * @param  (String) event
       * @param  (Mixed) ...
       * @return (Array)
       */
      emit: function emit(event, arg1, arg2
      /*, arg3...*/
      ) {
        var _self = this;

        var _ret = [];

        var _event = new EmitEvent(event);

        _event.result = _ret;

        var _callbacks, _all; // If no listeners, return quickly


        if (!(_callbacks = _self._callbacks)) {
          return _event;
        }

        var _type = _event.type;
        var _list = _callbacks[_type];
        var _any = _callbacks['*'];

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
          var _fn = _all[i];
          delete _fn.never;

          var r = _fn.apply(_self, args);

          if (r !== undefined) {
            _ret.push(r);
          }
        }

        return _event;
      },

      /**
       * Emit `event` with the given args after `delay` milliseconds.
       *
       * @param  (Number) delay - milliseconds after which to call listeners
       * @param  (String) event name
       * @param  (Mixed) ...
       * @return (Promise)
       */
      emitAfter: function emitAfter(delay, event, arg1, arg2
      /*, arg3...*/
      ) {
        var Promise = OnEmit.Promise || _Promise;

        var _self = this;

        var _ret = [];
        var i = +(typeof delay == 'number');

        var _event = new EmitEvent(arguments[i]);

        _event.result = _ret;

        var _callbacks, _all; // If no listeners, return quickly


        if (!(_callbacks = _self._callbacks)) {
          return Promise.resolve(_event);
        }

        var _type = _event.type;
        var _list = _callbacks[_type];
        var _any = _callbacks['*'];

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
          var _fn = _all[i];
          delete _fn.never;
          _ret[i] = PromiseTimeout.call(_self, _fn, args, delay);
        }

        return Promise.all(_ret).then(function (result) {
          _event.result = result;
          return _event;
        });
      },

      /**
       * Emit `event` with the given args asynchronously.
       *
       * @param  (String) event name
       * @param  (Mixed) ...
       * @return (OnEmit)
       */
      emitAsync: function emitAsync(event, arg1, arg2
      /*, arg3...*/
      ) {
        var Promise = OnEmit.Promise || _Promise;

        var _self = this;

        var _event = new EmitEvent(event);

        var _ret = [];
        _event.result = _ret;

        var _callbacks, _all; // If no listeners, return quickly


        if (!(_callbacks = _self._callbacks)) {
          return Promise.resolve(_event);
        }

        var _type = _event;
        var _list = _callbacks[_type];
        var _any = _callbacks['*'];

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
        var args = slice.call(arguments, 0); // const args = _append([_self], arguments);

        args[0] = _event;

        for (var i = 0; i < len; ++i) {
          var _fn = _all[i];
          delete _fn.never;
          _ret[i] = PromiseTimeout.call(_self, _fn, args);
        }

        return Promise.all(_ret).then(function (result) {
          _event.result = result;
          return _event;
        });
      },

      /**
       * Bind this emitter to obj.
       * After `emitter.bind(obj)`, a call to `obj.on()` is equivalent to `emitter.on()`
       *
       *
       *
       * @param  (Object) obj
       * @return (Object) obj
       */
      bind: function bind(obj) {
        var proto = OnEmit.prototype;

        var _self = this;

        for (var key in proto) {
          if (hop.call(proto, key) && isFunction(proto[key])) {
            obj[key] = _bind.call(proto[key], _self);
          }
        }

        return obj;
      },

      /**
       * Check if this OnEmit has `event` handlers.
       *
       * @param  (String) event
       * @return (Boolean)
       */
      hasListeners: function hasListeners(event) {
        var _list = _listeners.call(this, event, false);

        return !!(_list && _list.length);
      },

      /**
       * Check if this OnEmit has a specific event handler `fn`.
       *
       * @param  (String) event
       * @param  (Function) fn - event handler
       * @return (Boolean)
       */
      hasListener: function hasListener(event, fn) {
        if (!fn && event) {
          fn = event;
          event = '*';
        }

        var _list;

        if (event != '*') {
          _list = _listeners.call(this, event, false);
          return !!(_list && ~_list.indexOf(fn));
        } else {
          _list = this._callbacks;

          for (var key in _list) {
            if (hop.call(_list, key)) {
              if (_list[key].indexOf(fn) > -1) return true;
            }
          }
        }

        return false;
      },

      /**
       * Return array of callbacks for `event`.
       *
       * @param  (String) event
       * @return (Array)
       */
      listeners: _listeners
    });

    function _listeners(event, addMode) {
      var _callbacks = this._callbacks || (this._callbacks = {}),
          _type = event.type || String(event),
          _list = _callbacks[_type] || addMode && (_callbacks[_type] = []) || [];

      return _list;
    }

    OnEmit.Event = EmitEvent;
    /**
     *
     */

    function PromiseTimeout(fn, args, delay) {
      var Promise = OnEmit.Promise || _Promise;
      var that = this;
      delay = +delay;
      var timeoutFn = getTimeoutFn(delay);
      return new Promise(function (resolve, reject) {
        timeoutFn(function () {
          try {
            // `resolve` should accept a thenable and resolve/reject this Promise with it
            resolve(fn.apply(that, args)); // // This is how `resolve` shoud behave:
            // var ret = fn.apply(that, args);
            // if ( ret && isFunction(ret.then) ) {
            // ret.then(resolve, reject);
            // }
            // else {
            // resolve(ret);
            // }
          } catch (err) {
            reject(err);
          }
        }, delay);
      });
    }

    function getTimeoutFn(delay) {
      var timeoutFn = delay ? OnEmit.setTimeout || setTimeout : OnEmit.setImmediate || setImmediate;

      if (!timeoutFn && !delay) {
        timeoutFn = getTimeoutFn(1);
      }

      return timeoutFn;
    }
    /**
     * Copy properties to `obj` from `from`
     *
     * @param  (Object) obj
     * @param  (Object) from - source object
     *
     * @return (Object) obj
     * @api private
     */


    function _extend(obj, from) {
      for (var key in from) {
        if (hop.call(from, key)) {
          obj[key] = from[key];
        }
      }

      return obj;
    }

    function isFunction(obj) {
      return obj instanceof Function || typeof obj == 'function';
    } // bind = null; // Uncomment this line to test with polyfill
    // // Polyfill for .bind()
    // if ( !isFunction(bind) ) {
    //     bind = function (oThis) {
    //         var fArgs = slice.call(arguments, 1)
    //         ,   fToBind = this
    //         ,   fNOP = function () {}
    //         ,   fBound = fArgs.length
    //             ? function () {
    //                 var aArgs = arguments;
    //                 return fToBind.apply(
    //                     this instanceof fNOP && oThis ? this : oThis
    //                     , aArgs.length ? _append(fArgs, aArgs) : fArgs
    //                 );
    //             }
    //             : function () {
    //                 return fToBind.apply(
    //                     this instanceof fNOP && oThis ? this : oThis
    //                     , arguments
    //                 );
    //             }
    //         ;
    //         fNOP.prototype = fToBind.prototype;
    //         fBound.prototype = new fNOP();
    //         return fBound;
    //     };
    // }

    return OnEmit;

})));
