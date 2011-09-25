var vows = require('vows'),
    assert = require('assert'),
    Stream = require('stream').Stream,
    TokenStream = require('../lib/TokenStream');

function createTestStream(chunks, interval) {
    var stream = new Stream(),
        index = 0,
        intervalId = null;

    intervalId = setInterval(function () {
        if (index < chunks.length) {
            stream.emit('data', chunks[index]);
            index += 1;
        } else {
            stream.emit('end');
            clearTimeout(intervalId);
        }
    }, interval);

    return stream;
}

vows.describe('TokenStream').addBatch({
    'is a stream': {
        topic: function () {
            return new TokenStream();
        },
        'has the correct methods': function (stream) {
            assert.instanceOf(stream, Stream);
            assert.include(stream.prototype, 'end');
            assert.include(stream.prototype, 'pipe');
            assert.include(stream.prototype, 'write');
            assert.include(stream.prototype, 'resume');
            assert.include(stream.prototype, 'pause');
        },
        'readable and writable': function (stream) {
            assert.isTrue(stream.readable);
            assert.isTrue(stream.writable);
        }
    },
    'does not emit anything with empty rule set': {
        topic: function () {
            var stream = new TokenStream(),
                that = this,
                generator = null,
                dataReceived = false;

            stream.on('data', function () {
                dataReceived = true;
            });

            stream.on('end', function () {
                that.callback(dataReceived);
            });

            generator = createTestStream(['hello', 'world'], 10);
            generator.pipe(stream);
        },
        'received no data events': function (err) {
            assert.isFalse(err);
        }
    },
    'matches rules in a single chunk': {
        topic: function () {
            var stream = new TokenStream(),
                that = this,
                generator = null,
                results = [];

            stream.addRule(/(a)/gm, 'a');
            stream.addRule(/c/gm, 'c');

            stream.on('data', function (token, value) {
                results.push({
                    token: token,
                    value: value
                });
            });

            stream.on('end', function () {
                that.callback(null, results);
            });
            generator = createTestStream(['a', 'b', 'c', 'a'], 10);
            generator.pipe(stream);
        },
        'received three events': function (err, results) {
            assert.length(results, 3);
        },
        'events have the correct name and captured the right data': function (err, results) {
            assert.equal(results[0].token, 'a');
            assert.deepEqual(results[0].value, ['a']);
            assert.equal(results[1].token, 'c');
            assert.deepEqual(results[1].value, []);
            assert.equal(results[2].token, 'a');
            assert.deepEqual(results[2].value, ['a']);
        }
    },
    'matches rules over multiple chunks': {
        topic: function () {
            var stream = new TokenStream(),
                that = this,
                generator = null,
                results = [];

            stream.addRule(/(aa)/gm, 'aa');
            stream.addRule(/cc/gm, 'cc');

            stream.on('data', function (token, value) {
                results.push({
                    token: token,
                    value: value
                });
            });

            stream.on('end', function () {
                that.callback(null, results);
            });
            generator = createTestStream(['a', 'abc', 'ca', 'aa', 'aa'], 10);
            generator.pipe(stream);
        },
        'received four events': function (err, results) {
            assert.length(results, 4);
        },
        'events have the correct name captured the right data': function (err, results) {
            assert.equal(results[0].token, 'aa');
            assert.deepEqual(results[0].value, ['aa']);
            assert.equal(results[1].token, 'cc');
            assert.deepEqual(results[1].value, []);
            assert.equal(results[2].token, 'aa');
            assert.deepEqual(results[2].value, ['aa']);
            assert.equal(results[3].token, 'aa');
            assert.deepEqual(results[3].value, ['aa']);
        }
    }
}).export(module);
