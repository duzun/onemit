
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
        calls.push('one', val);
      });

      onemit.on('foo', function(event, val) {
        calls.push('two', val);
      });

      onemit.emit('foo', 1);
      onemit.emit('bar', 1);
      onemit.emit('foo', 2);

      calls.should.eql([ 'one', 1, 'two', 1, 'one', 2, 'two', 2 ]);
    });
  });

  describe('.only(event, fn)', function() {
    it('should add listeners', function() {
      var onemit = new OnEmit;
      var calls = [];

      onemit.on('foo', function(event, val) {
        calls.push('one', val);
      });

      onemit.on('foo', function(event, val) {
        calls.push('two', val);
      });

      onemit.emit('foo', 1);
      onemit.emit('bar', 1);
      onemit.emit('foo', 2);

      calls.should.eql([ 'one', 1, 'two', 1, 'one', 2, 'two', 2 ]);
    });

    it('should not add same listener more then once', function() {
      var onemit = new OnEmit;
      var calls = [];
      var listiner = function(event, val) {
          calls.push(event, val);
      };

      onemit.only('foo', listiner);
      onemit.only('foo', listiner);

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

      onemit.emit('foo', 1);
      onemit.emit('foo', 2);
      onemit.emit('foo', 3);
      onemit.emit('bar', 1);

      calls.should.eql([ 'one', 1 ]);
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
                called.should.eql(arguments);
                done();
            }
          });
          onemit.emit('foo', id);
          onemit.emitAfter(1, 'foo', id);
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
      function b (event) {
        called = true;
      }
      onemit.on('tobi', function (event) {
        onemit.off('tobi', b);
      });
      onemit.on('tobi', b);
      onemit.emit('tobi');
      called.should.be.true;
      called = false;
      onemit.emit('tobi');
      called.should.be.false;
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
      });
    });

    describe('when no handlers are present', function() {
      it('should return an empty array', function() {
        var onemit = new OnEmit;
        onemit.listeners('foo').should.eql([]);
      });
    });
  });

  describe('.hasListeners(event)', function() {
    describe('when handlers are present', function() {
      it('should return true', function() {
        var onemit = new OnEmit;
        onemit.on('foo', function() {});
        onemit.hasListeners('foo').should.be.true;
      });
    });

    describe('when no handlers are present', function() {
      it('should return false', function() {
        var onemit = new OnEmit;
        onemit.hasListeners('foo').should.be.false;
      });
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

        for ( key in proto ) if ( proto.hasOwnProperty(key) && 'function' == typeof proto[key] ) {
            // if ( key == 'bind' ) continue;
            methods.push(key);
            surogateProto[key] = (function (meth, fn) {
                return function () {
                    lastCall[meth] = true;
                    return fn.apply(this, arguments);
                }
            }(key, proto[key]));
        }

        // Test objects
        var plain = {};
        var onemit = new OnEmit;
        proto.bind.call(onemit, plain);

        // Restore original prototype
        for ( var i = 0; i < methods.length; ++i ) {
            var m = methods[i];
            lastCall[m] = false;
            plain[m](new String('test'));
            true.should.eql(lastCall[m]);
        }

        OnEmit.prototype = proto;
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
