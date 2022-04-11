# OnEmit

Event emitter that returns the event on emit [ .on() / .emit() / .emitAsync().then() ]

[![Build Status](https://travis-ci.com/duzun/onemit.svg?branch=master)](https://travis-ci.com/duzun/onemit)
[![Dependencies](https://david-dm.org/duzun/onemit.svg)](https://david-dm.org/duzun/onemit#info=dependencies&view=table)
[![devDependencies](https://david-dm.org/duzun/onemit/dev-status.svg)](https://david-dm.org/duzun/onemit#info=devDependencies&view=table)

Take control of your events!

This is a vanilla JS event system.

As oposed to "emit-and-forget" systems, this library allows you to do stuff after all event listeners have been executed.



## Usage

Include the library - it is an UMD module, works in Browser and Node.js.

```js
var OnEmit = require('emitter');
```

### `OnEmit` instance:
 ```js
var emitter = new OnEmit;

// Add event listeners
emitter.on('anything', function (event, obj, str, num) {
    // event instanceof OnEmit.Event -> true
    // ...
    return value;
});

// Emit events

// full version
var event = emitter.emit(new OnEmit.Event('anything'), {"with": "custom arguments"}, ...);

// object event
emitter.emit({type: 'anything', data: ["any type"]}, ...);
// short version
emitter.emit('anything', ...);

console.log(event); // -> { type: "anything", timeStamp: 1453059701092, result: [return1, return2, ...] }

// Remove event listeners
emitter.off('anything');
```


#### As a mixin:

The `OnEmit` may also be used as a mixin.
For example a "plain" object may become an emitter,

```js
var user = { name: 'dima' };
OnEmit(user);
user.on('im a user', function (event){ /*...*/ })
var event = user.emit('im a user');
```

#### As a `prototype` mixin:

You may extend an existing prototype.

```js
OnEmit(User.prototype);
var emitter = new User;
var event = emitter.emit('im a user as prototype method');
```

#### Bind `emitter` to an object

```js
var emitter = new OnEmit;
var user = { name: 'dima' };
emitter.bind(user);
user.on(...);
var event = user.emit('im a user');
```


### Register an `event` handler `fn`.
```js
emitter.on(event, fn);
```

* `event` should be an event name (String), or "*" to catch all events.
* `fn` is an event handler of form `function fn(emittedEvent, ...) { /*...*/ return value; }`.
    * `emittedEvent` is instance of `OnEmit.Event`.
    * The returned `value` goes into `emittedEvent.result[idx]`. `value` could be a promise (used with `.emitAsync()`).


#### Register an `event` handler `fn` only once.
```js
emitter.only(event, fn);
```


#### Register a single-shot `event` handler `fn`
removed immediately after it is invoked the first time.
```js
emitter.once(event, fn);
```


#### Wait for `event` with a Promise.
```js
emitter.when(event).then((event => {
    let { args } = event;
    // ...
}));

// reject after 10 seconds
emitter.when(event, 10e3).catch((error) => {
    console.log(error.type, error.message);
});
```


### Remove `event` listener(s)
```js
emitter.off(event, fn);
```

* Pass `event` and `fn` to remove a listener.
* Pass `event` to remove all listeners on that event.
* Pass nothing to remove all listeners on all events.


### Emit an `event` with variable option args.
```js
var event = emitter.emit(event, ...);
```

`event` argument can be either an
event name (`String`),
event properties (`Object`) including at least `.type` property,
or an `OnEmit.Event` instance.

`.emit()` returns an `OnEmit.Event` instance, which contains an array `.result` of whatever
event listeners have returned.

Event handlers can manipulate `event` properties before return.


#### Emit an `event` asynchronously.
```js
emitter.emitAsync(event, ...).then(function (event){
    // do something after all events have fired
    console.log(event.result);
});
```

`emitAsync` uses `OnEmit.setImmediate` or `setImmediate`, if available, or `setTimeout` otherwise.


#### Emit an `event` after `delay` milliseconds.
```js
emitter.emitAfter(delay, event, ...).then(function (event){
    // do something after all events have fired
    console.log(event.result);
});
```

`emitAfter` uses `OnEmit.setTimeout` or `setTimeout`.


### Get the array of callbacks
```js
emitter.listeners(event);
```


### Check if this emitter has `event` handlers.
```js
emitter.hasListeners(event);
```


### Check if this OnEmit has a specific event handler `fn`.
```js
emitter.hasListener(event, fn);
```


### The special event `*` listens on all events.
```js
emitter.on('*', fn);
emitter.emit('foo'); // -> fn('foo');
emitter.emit('bar'); // -> fn('bar');
emitter.off('*', fn);
```

## License

[MIT](https://github.com/duzun/onemit/blob/master/LICENSE)
