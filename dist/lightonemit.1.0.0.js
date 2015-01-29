/**
 *  A lightweight event emiter.
 *
 *  @author Dumitru Uzun (DUzun.Me)
 *  @version 1.0.0
 */
(function (name, root) {
    // -------------------------------------------------------------------------
    /// Events system:
    var eventHandlers = {};

    /**
     *  Bind an event listener to the model.
     *
     *  @param (string)   name      - event name
     *  @param (function) hdl       - event handler
     */
    function on(name, hdl) {
        var list = eventHandlers[name] || (eventHandlers[name] = []);
        list.push(hdl);
        return this;
    }

    // -------------------------------------------------------------------------
    /**
     *  Unbind an event listener or a list of event listeners from the model.
     *
     *  @param (string)   name      - event name    - optional
     *  @param (function) hdl       - event handler - optional
     *
     *  Usage:
     *     .off(name, hdl) - remove the hdl from event name
     *     .off(name)      - remove all listeners for event name
     */
    function off(name, hdl) {
        var list = eventHandlers[name];
        if ( list ) {
            if ( hdl ) {
                eventHandlers[name] = _.difference(list, [hdl]);
            }
            else {
                delete eventHandlers[name];
            }
        }
        return this;
    }

    // -------------------------------------------------------------------------
    /**
     *  Emit an event - used internally.
     *  @private
     */
    function emit(name, args, thisArg, delay) {
        var list = eventHandlers[name];
        if ( list ) {
            thisArg || (thisArg = this);
            if ( args ) {
                args = args.slice(); // make a copy
                args.unshift(name);
            }
            else {
                args = [name];
            }
            _.each(list, function (hdl, idx) {
                // var _args = args.slice();
                delay > -1
                    ? setTimeout(function () {
                        hdl.apply(thisArg, args);
                      }, delay)
                    : hdl.apply(thisArg, args)
                ;
            });
        }
        return this;
    }
    // -------------------------------------------------------------------------
    lightOnEmit.on   = on;
    lightOnEmit.off  = off;
    lightOnEmit.emit = emit;

    // Export for debugging and testing
    lightOnEmit._eventHandlers = eventHandlers;

    // -------------------------------------------------------------------------
    root[name] = lightOnEmit;
    // -------------------------------------------------------------------------

}
('lonemit', typeof global == 'undefined' ? this : global));
