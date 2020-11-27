
var OnEmit = require('..');

function Custom() {
    OnEmit.call(this)
}

Custom.prototype.__proto__ = OnEmit.prototype;

describe('Custom', function() {
    describe('with onemit.call(this)', function() {
        it('should work', function(done) {
            var onemit = new Custom;
            onemit.on('foo', function (name) {
                done();
            });
            onemit.emit('foo');
        });
    });
});

describe('OnEmit', function() {
    describe('.on(event, fn)', function() {
        it('should add listeners', function() {
            var onemit = new OnEmit;
            var calls = [];

            onemit.on('foo', function(event, val) {
                event.should.have.property('type');
                event.type.should.be.exactly('foo');
                event.should.have.property('timeStamp');
                calls.push('one', val);
            });

            onemit.on('foo', function(event, val) {
                calls.push('two', val);
            });

            onemit.emit('foo', 1);
            onemit.emit('bar', 1);
            onemit.emit({type: 'foo', data: 'test'}, 2);

            calls.should.eql([ 'one', 1, 'two', 1, 'one', 2, 'two', 2 ]);
        });
    });

    describe('.only(event, fn)', function() {
        it('should add listeners', function() {
            var onemit = new OnEmit;
            var calls = [];

            onemit.only('foo', function(event, val) {
                calls.push('one', val);
            });

            onemit.only('foo', function(event, val) {
                calls.push('two', val);
            });

            onemit.emit('foo', 1);
            onemit.emit('bar', 1);
            onemit.emit({type:'foo'}, 2);

            calls.should.eql([ 'one', 1, 'two', 1, 'one', 2, 'two', 2 ]);
        });

        it('should not add same listener more then once', function() {
            var onemit = new OnEmit;
            var calls = [];
            var listiner = function(event, val) {
                calls.push(''+event, val);
            };

            onemit.only('foo', listiner);
            onemit.only({type: 'foo'}, listiner);

            onemit.emit('foo', 1);
            onemit.emit('foo', 2);

            calls.should.eql([ 'foo', 1, 'foo', 2 ]);
        });
    });

    describe('.once(event, fn)', function() {
        it('should add a single-shot listener', function() {
            var onemit = new OnEmit;
            var calls = [];

            onemit.once('foo', function(event, val) {
                calls.push('one', val);
            });

            onemit.emit({type:'foo'}, 1);
            onemit.emit('foo', 2);
            onemit.emit({type:'foo'}, 3);
            onemit.emit('bar', 1);

            calls.should.eql([ 'one', 1 ]);
        });
    });

    describe('.when(event[, timeout])', function() {
        it('should add a single-shot listener and return a Promise', function() {
            var onemit = new OnEmit;
            var calls = [];

            let prom = onemit.when('foo')
            .then(function(event) {
                calls.push('one', event.args[0]);
            });

            onemit.emit('bar', 1);
            calls.should.eql([]);
            onemit.emit({type:'foo'}, 1);
            onemit.emit('foo', 2);
            onemit.emit({type:'foo'}, 3);

            return prom.then(function() {
                calls.should.eql([ 'one', 1 ]);
            });
        });

        it('should reject after timeout if not fired', function() {
            var onemit = new OnEmit;
            var calls = [];

            let prom = onemit.when('foo', 16)
            .then(function(event) {
                calls.push('one', event.args[0]);
            });

            onemit.emit('bar', 1);
            onemit.emit({type:'notfoo'}, 1);

            return prom.then(function() {
                calls.should.eql(false); // never gets here
            }, function(err) {
                calls.should.eql([]);
                (typeof err.message).should.eql('string');
                err.type.should.eql('timeout');
            });
        });
    });

    describe('.emit(event, ...)', function () {
        it('should emit immediately', function () {
            var onemit = new OnEmit;
            var calls = [];

            onemit.on('foo', function(event) {
                calls.push('called');
            });

            onemit.emit('foo', 1);

            calls.should.eql(['called']);
        });

        it('should accept object event .emit({type:"event", ...}, ...)', function () {
            var onemit = new OnEmit;
            var calls = [];

            onemit.on('foo', function(event) {
                calls.push('called with ' + event.data);
            });

            onemit.emit({type: 'foo', data: 'test data'}, 1);

            calls.should.eql(['called with test data']);
        });
    });

    describe('.emitAfter(delay, event, ...)', function () {
        it('should not emit immediately', function () {
            var onemit = new OnEmit;
            var calls = [];

            onemit.on('foo', function(event) {
                calls.push('called');
            });

            onemit.emitAfter(1, 'foo', 1);

            calls.should.eql([]);
        });

        it('should emit the same event as .emit(event, ...)', function (done) {
            var onemit = new OnEmit;
            var called;
            var id = Math.random();

            onemit.on('foo', function(event, id) {
                if ( !called ) {
                    called = arguments;
                }
                else {
                    called[0].should.have.property('type');
                    called[0].type.should.eql(arguments[0].type);
                    [].slice.call(called, 1).should.eql([].slice.call(arguments, 1));
                    done();
                }
            });
            onemit.emit('foo', id);
            onemit.emitAfter(1, 'foo', id);
        });

        it('should return a Promise', function () {
            var onemit = new OnEmit;
            var result;

            onemit.on('foo', function f1(event) {
                return result = Math.random();
            });
            onemit.on('foo', function f2(event) {
                return 'f2';
            });

            var promiseEvent = onemit.emitAfter(1, {type: 'foo'});
            promiseEvent.then.should.be.a.Function();

            return promiseEvent
            .then(function (event) {
                event.result.should.be.an.Array();
                event.result.should.eql([result, 'f2']);
            })
            ;
        });
    });

    describe('.emitAsync(event, ...)', function () {
        it('should not emit immediately', function () {
            var onemit = new OnEmit;
            var calls = [];

            onemit.on('foo', function(event) {
                calls.push('called');
            });

            onemit.emitAsync('foo', 1);

            calls.should.eql([]);
        });

        it('should emit the same event as .emit(event, ...)', function (done) {
            var onemit = new OnEmit;
            var called;
            var id = Math.random();

            onemit.on('foo', function(event, id) {
                if ( !called ) {
                    called = arguments;
                }
                else {
                    called[0].type.should.eql(arguments[0].type);
                    [].slice.call(called, 1).should.eql([].slice.call(arguments, 1));
                    done();
                }
            });
            onemit.emit('foo', id);
            onemit.emitAsync('foo', id);
        });

        it('should return a Promise', function () {
            var onemit = new OnEmit;
            var result;

            onemit.on('foo', function f1(event) {
                return result = Math.random();
            });
            onemit.on('foo', function f2(event) {
                return 'f2';
            });

            var promiseEvent = onemit.emitAsync({type: 'foo'});
            promiseEvent.then.should.be.a.Function();

            return promiseEvent
            .then(function (event) {
                event.result.should.be.an.Array();
                event.result.should.eql([result, 'f2']);
            })
            ;
        });
    });

    describe('.off(event, fn)', function() {
        it('should remove a listener', function() {
            var onemit = new OnEmit;
            var calls = [];

            function one(event) { calls.push('one'); }
            function two(event) { calls.push('two'); }

            onemit.on('foo', two);
            onemit.on('foo', one);
            onemit.on('foo', two);
            onemit.on('foo', two);
            onemit.off('foo', two);

            onemit.emit('foo');

            calls.should.eql([ 'one' ]);
        });

        it('should work with .once()', function() {
            var onemit = new OnEmit;
            var calls = [];

            function one(event) { calls.push('one'); }

            onemit.once('foo', one);
            onemit.once('fee', one);
            onemit.off('foo', one);

            onemit.emit('foo');

            calls.should.eql([]);
        });

        it('should work when called from an event', function() {
            var onemit = new OnEmit
            ,   called
            ;
            function b(event) {
                called = true;
            }
            onemit.on('tobi', function (event) {
                onemit.off('tobi', b);
            });
            onemit.on('tobi', b);
            onemit.emit('tobi');
            called.should.be.true();
            called = false;
            onemit.emit('tobi');
            called.should.be.false();
        });
    });

    describe('.off(event)', function() {
        it('should remove all listeners for an event', function() {
            var onemit = new OnEmit;
            var calls = [];

            function one(event) { calls.push('one'); }
            function two(event) { calls.push('two'); }

            onemit.on('foo', one);
            onemit.on('foo', two);
            onemit.off('foo');

            onemit.emit('foo');
            onemit.emit('foo');

            calls.should.eql([]);
        });
    });

    describe('.off()', function() {
        it('should remove all listeners', function() {
            var onemit = new OnEmit;
            var calls = [];

            function one(event) { calls.push('one'); }
            function two(event) { calls.push('two'); }

            onemit.on('foo', one);
            onemit.on('bar', two);

            onemit.emit('foo');
            onemit.emit('bar');

            onemit.off();

            onemit.emit('foo');
            onemit.emit('bar');

            calls.should.eql(['one', 'two']);
        });
    });

    describe('.listeners(event)', function() {
        describe('when handlers are present', function() {
            it('should return an array of callbacks', function() {
                var onemit = new OnEmit;
                function foo() {}
                onemit.on('foo', foo);
                onemit.listeners('foo').should.eql([foo]);
                onemit.listeners('bar').should.eql([]);
                onemit.listeners('*').should.eql([]);
            });
        });

        describe('when no handlers are present', function() {
            it('should return an empty array', function() {
                var onemit = new OnEmit;
                onemit.listeners('foo').should.eql([]);
                onemit.listeners('bar').should.eql([]);
                onemit.listeners('*').should.eql([]);
            });
        });
    });

    describe('.hasListeners(event)', function() {
        describe('when handlers are present', function() {
            it('should return true', function() {
                var onemit = new OnEmit;
                onemit.on('foo', function() {});
                onemit.hasListeners('foo').should.be.true();
            });
        });

        describe('when no handlers are present', function() {
            it('should return false', function() {
                var onemit = new OnEmit;
                onemit.hasListeners('foo').should.be.false();
            });
        });
    });

    describe('.hasListener(event, fn)', function() {
        var onemit = new OnEmit;
        var fn1 = function fn1() {};
        var fn2 = function fn2() {};
        it('should return true when `fn` is listening for `event`', function() {
            onemit.hasListener('foo', fn1).should.be.false();
            onemit.on('foo', fn1);
            onemit.hasListener('foo', fn2).should.be.false();
            onemit.hasListener('bar', fn1).should.be.false();
            onemit.hasListener('foo', fn1).should.be.true();
            onemit.off('foo', fn1);
            onemit.hasListener('foo', fn1).should.be.false();
        });
        describe('.hasListener("*", fn)', function() {
            onemit.hasListener('*', fn2).should.be.false();
            onemit.on('bar', fn2);
            onemit.hasListener('*', fn2).should.be.true();
            onemit.off('bar', fn2);
            onemit.hasListener('*', fn2).should.be.false();
        });
        describe('.hasListener(fn)', function() {
            onemit.hasListener(fn2).should.be.false();
            onemit.on('bar', fn2);
            onemit.hasListener(fn2).should.be.true();
            onemit.off('bar', fn2);
            onemit.hasListener(fn2).should.be.false();
        });
    });

    describe('.bind(obj)', function () {
        it('should add methods of emitter to obj', function () {
            // Test data
            var methods = [];
            var lastCall = {};

            // Prepare spies
            var proto = OnEmit.prototype;
            var surogateProto = {};
            OnEmit.prototype = surogateProto;

            for ( var key in proto ) if ( proto.hasOwnProperty(key) && 'function' == typeof proto[key] ) {
                // if ( key == 'bind' ) continue;
                methods.push(key);
                surogateProto[key] = (function (meth, fn) {
                    return function () {
                        lastCall[meth] = true;
                        return fn.apply(this, arguments);
                    }
                }(key, proto[key]));
            }

            // .off() is last
            let i = methods.indexOf('off');
            if(~i) {
                methods.splice(i, 1);
                methods.push('off');
            }

            // Test objects
            var plain = {};
            var onemit = new OnEmit;
            proto.bind.call(onemit, plain);

            // Restore original prototype
            let next = [];
            for ( let i = 0; i < methods.length; ++i ) {
                let m = methods[i];

                lastCall[m] = false;
                let args = [new String('test')];
                let p = plain[m].apply(plain, args);
                if(p && p.then) {
                    next.push(p.catch(()=>{})); // silence the errors
                }
                true.should.eql(lastCall[m]);
            }

            return Promise.all(next)
            .finally(() => {
                OnEmit.prototype = proto;
            });
        });
    });

});

describe('onemit(obj)', function() {
    it('should mixin', function(done) {
        var proto = {};
        OnEmit(proto);
        proto.on('something', function (event) {
            done();
        });
        proto.emit('something');
    });
});
