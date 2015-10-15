# On / Emit

Event emitter [ .on() / .emit() ]
[![Build Status](https://travis-ci.org/duzun/onemit.svg?branch=master)](https://travis-ci.org/duzun/onemit)
[![Dependencies](https://david-dm.org/duzun/onemit.svg)](https://david-dm.org/duzun/onemit#info=dependencies&view=table)
[![devDependencies](https://david-dm.org/duzun/onemit/dev-status.svg)](https://david-dm.org/duzun/onemit#info=devDependencies&view=table)

The `OnEmit` may also be used as a mixin.
For example a "plain" object may become an emitter,
or you may extend an existing prototype.


## Usage

### As an `OnEmit` instance:
 ```js
var OnEmit = require('emitter');
var emitter = new OnEmit;
emitter.emit('something', 'with options');
```

### As a mixin:
```js
var OnEmit = require('emitter');
var user = { name: 'tobi' };
OnEmit(user);
user.emit('im a user');
```

### As a `prototype` mixin:
```js
var OnEmit = require('emitter');
OnEmit(User.prototype);
var emitter = new User;
emitter.emit('im a user as prototype method');
```

### Register an `event` handler `fn`.
```js
emitter.on(event, fn);
```

### Register an `event` handler `fn` only once.
```js
emitter.only(event, fn);
```


### Register a single-shot `event` handler `fn`
removed immediately after it is invoked the first time.
```js
emitter.once(event, fn);
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
emitter.emit(event, ...);
```

### Emit an `event` with variable option args after `delay` milliseconds.
```js
emitter.emitAfter(delay, event, ...);
```

`emitAfter` uses `emitter.setTimeout` or `setTimeout`.

### Emit an `event` with variable option args asynchronously.
```js
emitter.emitAsync(event, ...);
```

`emitAsync` uses `emitter.setImmediate` or `setImmediate`, if available, or `setTimeout` otherwise.

### Get the array of callbacks
```js
emitter.listeners(event);
```


### Check if this emitter has `event` handlers.
```js
emitter.hasListeners(event);
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
