/**
 *   Event emitter for JS.
 *
 *   Inspired by https://github.com/component/emitter
 *
 *   @author  Dumitru Uzun (DUzun.Me)
 *   @license MIT
 *   @version 1.2.3
 *   @repo    https://github.com/duzun/onemit
 */

/*   Ussage:
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
 *          emitter.emit('something');
 *
 *
 *      As a mixin:
 *          var OnEmit = require('emitter');
 *          var user = { name: 'tobi' };
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
;(function (name, root, undefined) {
    'use strict';
    var UNDEFINED = undefined + '';

    // Native methods
    var hop    = Object.prototype.hasOwnProperty;
    var slice  = [].slice;
    var splice = [].splice;
    var bind   = Function.prototype.bind;
    var _setTimeout = typeof setTimeout != 'undefined' ? setTimeout : root.setTimeout;
(
    typeof define !== 'function' || !define.amd
  ? typeof module != UNDEFINED && module.exports
  // CommonJS
  ? function (deps, factory) { module.exports = factory(); }
  // Browser
  : function (deps, factory) { root[name] = factory(); }
  // AMD
  : define
)
/*define*/([], function factory() {

    /**
     * Initialize a new `OnEmit`.
     *
     */
    function OnEmit(obj) {
        if (obj) return _mixin(obj);
    };

    /**
     * Mixin the OnEmit properties.
     *
     * @param  (Object) obj
     * @return (Object) obj
     * @api private
     */
    function _mixin(obj) {
        var proto = OnEmit.prototype
        ,   key
        ;
        for ( key in proto ) if ( hop.call(proto, key) ) {
            obj[key] = proto[key];
        }
        return obj;
    }

    /**
     *  Listen on the given `event` with `fn`.
     *
     *  @param  (String)   name  - event name
     *  @param  (Function) fn    - event handler
     *  @return (OnEmit)
     */
    OnEmit.prototype.on = function(event, fn) {
        var _list = _listeners.call(this, event);
        _list.push(fn);
        return this;
    };

    /**
     *  Listen on the given `event` with `fn`
     *  only if not already listening.
     *
     *  @param  (String)   name  - event name
     *  @param  (Function) fn    - event handler
     *  @return (OnEmit)
     */
    OnEmit.prototype.only = function(event, fn) {
        var _list = _listeners.call(this, event);
        if ( _list.indexOf(fn) < 0 ) {
            _list.push(fn);
        }
        return this;
    };

    /**
     * Adds an `event` listener that will be invoked only once.
     *
     * @param  (String)   event
     * @param  (Function) fn
     * @return (OnEmit)
     */
    OnEmit.prototype.once = function(event, fn) {
        function _fn() {
            this.off(event, _fn);
            fn.apply(this, arguments);
        }
        _fn.fn = fn;
        return this.on(event, _fn);
    };

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
    OnEmit.prototype.off = function (event, fn) {
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
    };

    /**
     * Emit `event` with the given args.
     *
     * @param  (String) event
     * @param  (Mixed) ...
     * @return (OnEmit)
     */
    OnEmit.prototype.emit = function(event, arg1, arg2/*, arg3...*/) {
        var _self = this, _callbacks, _list, _any, _all;

        // If no listeners, return quickly
        if ( !(_callbacks = _self._callbacks) ) {
            return _self;
        }

        _list = _callbacks[event];
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
                return _self;
            }
        }

        var args = slice.call(arguments, 0)
        ,   len = _all.length
        ,   i = 0
        ;
        for ( ; i < len; ++i ) {
            _all[i].apply(_self, args);
        }

        return _self;
    };

    /**
     * Emit `event` with the given args after `delay` milluseconds.
     *
     * @param  (Number) delay - milliseconds after which to call listeners
     * @param  (String) event name
     * @param  (Mixed) ...
     * @return (OnEmit)
     */
    OnEmit.prototype.emitAfter = function(delay, event, arg1, arg2/*, arg3...*/) {
        var _self = this, _callbacks, _list, _any, _all;
        var sto = OnEmit.setTimeout || _setTimeout;


        // If no listeners, return quickly
        if ( !(_callbacks = _self._callbacks) ) {
            return _self;
        }

        _list = _callbacks[event];
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
                return _self;
            }
        }

        var len = _all.length
        ,   i = +(typeof delay == 'number')
        ,   args = slice.call(arguments, i)
        ;
        if ( !i ) {
            delay = 0;
        }
        else {
            i = 0;
        }
        for ( ; i < len; ++i ) {
            sto(
                (function (_fn) {
                    return function () {
                        _fn.apply(_self, slice.call(args, 0));
                    }
                }(_all[i]))
                , delay
            );
        }
        return _self;
    }

    /**
     * Bind this emitter to obj.
     * After `emitter.bind(obj)`, a call to `obj.on()` is equivalent to `emitter.on()`
     *
     *
     *
     * @param  (Object) obj
     * @return (Object) obj
     */
    OnEmit.prototype.bind = function(obj) {
        var  proto = OnEmit.prototype
        ,   _self = this
        ,   key
        ;
        for ( key in proto ) if ( hop.call(proto, key) && 'function' == typeof proto[key] ) {
            obj[key] = bind.call(proto[key], _self);
        }
        return obj;
    }

    /**
     * Return array of callbacks for `event`.
     *
     * @param  (String) event
     * @return (Array)
     */
    function _listeners(event) {
        var _callbacks = this._callbacks || (this._callbacks = {})
        ,   _list = _callbacks[event] || (_callbacks[event] = [])
        ;
        return _list;
    };

    OnEmit.prototype.listeners = _listeners;


    /**
     * Check if this OnEmit has `event` handlers.
     *
     * @param  (String) event
     * @return (Boolean)
     */
    OnEmit.prototype.hasListeners = function(event) {
        return !!_listeners.call(this, event).length;
    };

    /**
     * Expose `OnEmit`.
     */
    return OnEmit;

});

    // bind = null; // Uncomment this line to test with polyfill

    // Polyfill for .bind()
    if ( 'function' != typeof bind ) {
        bind = function (oThis) {
            var aArgs = slice.call(arguments, 1)
            ,   fToBind = this
            ,   fNOP = function () {}
            ,   fBound = function () {
                    return fToBind.apply(this instanceof fNOP && oThis
                            ? this
                            : oThis,
                            aArgs.concat(slice.call(arguments)));
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
        }
    }

}
('OnEmit', typeof global == 'undefined' ? this : global));
