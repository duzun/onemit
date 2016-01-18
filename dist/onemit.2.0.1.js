/**
 *   Event emitter for JS.
 *
 *   Inspired by https://github.com/component/emitter
 *
 *   @author  Dumitru Uzun (DUzun.Me)
 *   @license MIT
 *   @version 2.0.1
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
;(function (name, global, undefined) {
    'use strict';
    var UNDEFINED = undefined + '';

    // Native methods
    var hop    = ({}).hasOwnProperty;
    var slice  = [].slice;
    var splice = [].splice;
    var bind   = hop.bind;
    var _setTimeout   = typeof setTimeout   != UNDEFINED ? setTimeout   : global.setTimeout  ;
    var _setImmediate = typeof setImmediate != UNDEFINED ? setImmediate : global.setImmediate;
    var _Promise      = typeof Promise      != UNDEFINED ? Promise      : global.Promise;
(
    typeof define !== 'function' || !define.amd
  ? typeof module != UNDEFINED && module.exports
  // CommonJS
  ? function (deps, factory) { module.exports = factory(); }
  // Browser
  : function (deps, factory) { global[name] = factory(); }
  // AMD
  : define
)
/*define*/([], function factory() {

    /**
     * Initialize a new `OnEmit`.
     *
     */
    function OnEmit(obj) {
        if (obj) return _extend(obj, OnEmit.prototype);
    };

    /**
     * Event constructor.
     *
     * @param (Object) props - { type: "eventName", ... } or just "eventName"
     */
    function EmitEvent(props) {
        var event = this;
        if ( !(event instanceof EmitEvent) ) {
            return new EmitEvent(props);
        }
        if ( props == undefined ) {
            props = '';
        }
        if ( typeof props == 'string' ) {
            props = { type: props };
        }
        _extend(event, props);
        event.timeStamp = Date.now();
    }

    _extend(EmitEvent.prototype, {
        type: '*',
        toString: function () { return this.type; }
    });

    _extend(OnEmit.prototype, {
        /**
         *  Listen on the given `event` with `fn`.
         *
         *  @param  (String)   name  - event name
         *  @param  (Function) fn    - event handler
         *  @return (OnEmit)
         */
        on: function(event, fn) {
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
        only: function(event, fn) {
            var _list = _listeners.call(this, event, true);
            if ( _list.indexOf(fn) < 0 ) {
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
        once: function(event, fn) {
            function _fn() {
                this.off(event, _fn);
                fn.apply(this, arguments);
            }
            _fn.fn = fn;
            return this.on(event, _fn);
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
        off: function (event, fn) {
            var _callbacks = this._callbacks;

            // No handlers, return quickly
            if ( !_callbacks ) return this;

            // remove all handlers
            if (0 == arguments.length) {
                if ( _callbacks ) this._callbacks = {};
                return this;
            }

            // specific event:
            var _list = _callbacks[event];
            if (!_list) return this;

            // remove all handlers
            if (1 == arguments.length) {
                delete _callbacks[event];
                return this;
            }

            // remove specific handler
            var _cb;
            for (var i = _list.length; i--;) {
                _cb = _list[i];
                if ( _cb === fn || _cb.fn === fn ) {
                    splice.call(_list, i, 1);
                }
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
        emit: function(event, arg1, arg2/*, arg3...*/) {
            var _self = this
            ,   _type, _callbacks, _list, _any, _all
            ,   _ret = []
            ,   _event = new EmitEvent(event);
            ;
            _event.result = _ret;

            // If no listeners, return quickly
            if ( !(_callbacks = _self._callbacks) ) {
                return _event;
            }

            _type = _event.type;
            _list = _callbacks[_type];
            _any = _callbacks['*'];

            if ( _list && _list.length ) {
                if ( _any && _any.length ) {
                    _all = _list.concat(_any);
                }
                else {
                    _all = slice.call(_list, 0);
                }
            }
            else {
                if ( _any && _any.length ) {
                    _all = slice.call(_any, 0);
                }
                else {
                    return _event;
                }
            }

            var args = slice.call(arguments, 0)
            ,   len = _all.length
            ,   i = 0
            ,   r
            ;
            args[0] = _event;
            for ( ; i < len; ++i ) {
                r = _all[i].apply(_self, args);
                if ( r !== undefined ) {
                    _ret.push(r);
                }
            }

            return _event;
        },

        /**
         * Emit `event` with the given args after `delay` milluseconds.
         *
         * @param  (Number) delay - milliseconds after which to call listeners
         * @param  (String) event name
         * @param  (Mixed) ...
         * @return (Promise)
         */
        emitAfter: function(delay, event, arg1, arg2/*, arg3...*/) {
            var Promise = OnEmit.Promise || _Promise;
            var _self = this
            ,   _type, _callbacks, _list, _any, _all
            ,   _ret = []
            ,   i = +(typeof delay == 'number')
            ,   _event = new EmitEvent(arguments[i]);
            ;
            _event.result = _ret;

            // If no listeners, return quickly
            if ( !(_callbacks = _self._callbacks) ) {
                return Promise.resolve(_event);
            }

            _type = _event.type;
            _list = _callbacks[_type];
            _any = _callbacks['*'];

            if ( _list && _list.length ) {
                if ( _any && _any.length ) {
                    _all = _list.concat(_any);
                }
                else {
                    _all = _list;
                }
            }
            else {
                if ( _any && _any.length ) {
                    _all = _any;
                }
                else {
                    return Promise.resolve(_event);
                }
            }

            var len = _all.length
            ,   args = slice.call(arguments, i)
            ;
            args[0] = _event;
            if ( !i ) {
                delay = 0;
            }
            else {
                i = 0;
            }
            for ( ; i < len; ++i ) {
                _ret[i] = PromiseTimeout.call(_self, _all[i], args, delay);
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
        emitAsync: function(event, arg1, arg2/*, arg3...*/) {
            var Promise = OnEmit.Promise || _Promise;
            var _self = this
            ,   _type, _callbacks, _list, _any, _all
            ,   _ret = []
            ,   _event = new EmitEvent(event);
            ;
            _event.result = _ret;

            // If no listeners, return quickly
            if ( !(_callbacks = _self._callbacks) ) {
                return Promise.resolve(_event);
            }

            _type = _event;
            _list = _callbacks[_type];
            _any = _callbacks['*'];

            if ( _list && _list.length ) {
                if ( _any && _any.length ) {
                    _all = _list.concat(_any);
                }
                else {
                    _all = _list;
                }
            }
            else {
                if ( _any && _any.length ) {
                    _all = _any;
                }
                else {
                    return Promise.resolve(_event);
                }
            }

            var len = _all.length
            // ,   args = _append([_self], arguments)
            ,   args = slice.call(arguments, 0)
            ,   i = 0
            ;
            args[0] = _event;
            for ( ; i < len; ++i ) {
                _ret[i] = PromiseTimeout.call(_self, _all[i], args);
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
        bind: function(obj) {
            var  proto = OnEmit.prototype
            ,   _self = this
            ,   key
            ;
            for ( key in proto ) if ( hop.call(proto, key) && 'function' == typeof proto[key] ) {
                obj[key] = bind.call(proto[key], _self);
            }
            return obj;
        },

        /**
         * Check if this OnEmit has `event` handlers.
         *
         * @param  (String) event
         * @return (Boolean)
         */
        hasListeners: function(event) {
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
        hasListener: function (event, fn) {
            if ( !fn && event ) {
                fn = event;
                event = '*';
            }
            if ( event != '*' ) {
                var _list = _listeners.call(this, event, false);
                return !!(_list && ~_list.indexOf(fn));
            }
            else {
                var _list = this._callbacks;
                for ( var key in _list ) if ( hop.call(_list, key) ) {
                    if ( _list[key].indexOf(fn) > -1 ) return true;
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
        var _callbacks = this._callbacks || (this._callbacks = {})
        ,   _type = event.type || String(event)
        ,   _list = _callbacks[_type] || addMode && (_callbacks[_type] = []) || []
        ;
        return _list;
    };

    OnEmit.Event = EmitEvent;

    /**
     *
     */
    function PromiseTimeout(fn, args, delay) {
        var Promise = OnEmit.Promise || _Promise;
        var that = this;
        delay = +delay;
        var timeoutFn = !delay && (OnEmit.setImmediate || _setImmediate) || OnEmit.setTimeout || _setTimeout;

        return new Promise(function (resolve, reject) {
            timeoutFn(function () {
                try {
                    // `resolve` should accept a thenable and resolve/reject this Promise with it
                    resolve(fn.apply(that, args));

                    // // This is how `resolve` shoud behave:
                    // var ret = fn.apply(that, args);
                    // if ( ret && typeof ret.then == 'function' ) {
                        // ret.then(resolve, reject);
                    // }
                    // else {
                        // resolve(ret);
                    // }
                }
                catch(err) {
                    reject(err);
                }
            }, delay)
        });
    }


    /**
     * Expose `OnEmit`.
     */
    return OnEmit;
});

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
        for ( var key in from ) if ( hop.call(from, key) ) {
            obj[key] = from[key];
        }
        return obj;
    }

    /**
     * Append elements of `args` to `array`.
     *
     * This function is similar to `array.concat(args)`,
     * but also works on non-Array `args` as if it where an Array,
     * and it modifies the original `array`.
     *
     * @param (Array) array - an array or array-like object
     * @param (Array) args  - an array or array-like object to append to `array`
     *
     * @return (Array) array
     */
    function _append(array, args/*, ...*/) {
        var i = array.length
        ,   j
        ,   k = 1
        ,   l
        ,   m = arguments.length
        ,   a
        ;
        for(; k < m; ++k) {
            a = arguments[k];
            array.length =
            l = i + a.length;
            for(j = 0; i < l; ++i, ++j) {
                array[i] = a[j];
            }
        }
        return array;
    }

    // bind = null; // Uncomment this line to test with polyfill

    // Polyfill for .bind()
    if ( 'function' != typeof bind ) {
        bind = function (oThis) {
            var fArgs = slice.call(arguments, 1)
            ,   fToBind = this
            ,   fNOP = function () {}
            ,   fBound = fArgs.length
                ? function () {
                    var aArgs = arguments;
                    return fToBind.apply(
                        this instanceof fNOP && oThis ? this : oThis
                      , aArgs.length ? _append(fArgs, aArgs) : fArgs
                    );
                }
                : function () {
                    return fToBind.apply(
                        this instanceof fNOP && oThis ? this : oThis
                      , arguments
                    );
                }
            ;
            fNOP.prototype = fToBind.prototype;
            fBound.prototype = new fNOP();
            return fBound;
        };
    }

    if ( 'function' != typeof _setTimeout ) {
        // In Firefox Addons there is no setTimeout global. We have to load it from a module.
        if ( 'function' == typeof 'require' ) {
            var TIMERS  = require("sdk/timers");
            _setTimeout = TIMERS.setTimeout;
            // clearTimeout  = TIMERS.clearTimeout;

            // In Firefox SDK there is setImmediate, so use it!
            if ( !_setImmediate ) {
                _setImmediate = TIMERS.setImmediate;
            }
        }
    }

}
('OnEmit', typeof self == 'undefined' ? typeof global == 'undefined' ? this : global : self));
