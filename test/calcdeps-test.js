var vows = require('vows'),
    assert = require('assert'),
    async = require('async'),
    parseFiles = require('../lib/calcdeps').parseFiles;

function parseAs(provide, require) {
    var context = {
            topic: function (result) {
                return result[this.context.name];
            }
        };

    context['includes the correct require statements'] = function (item) {
        assert.deepEqual(item.require, require);
    };

    context['includes the correct provide statements'] = function (item) {
        assert.deepEqual(item.provide, provide);
    };

    return context;
}

vows.describe('calcdeps.js').addBatch({
    'parseFiles': {
        topic: function () {
            parseFiles([
                './test/data/index.js',
                './test/data/lib/foo.js',
                './test/data/lib/bar.js',
                './test/data/test.js'
            ], this.callback);
        },
        'did not return an error': function (err, result) {
            assert.isNull(err);
        },
        'returned four results': function (err, result) {
            assert.length(result, 4);
        },
        'verify results': {
            topic: function (result) {
                var r = {};
                result.forEach(function (item) {
                    r[item.path] = {
                        require: item.require,
                        provide: item.provide
                    };
                });
                return r;
            },
            'includes all paths': function (result) {
                assert.include(result, './test/data/test.js');
                assert.include(result, './test/data/lib/foo.js');
                assert.include(result, './test/data/lib/bar.js');
                assert.include(result, './test/data/index.js');
            },
            './test/data/test.js': parseAs([], []),
            './test/data/lib/foo.js': parseAs(['example.foo'], []),
            './test/data/lib/bar.js': parseAs(['example.bar'], []),
            './test/data/index.js': parseAs(['example.index'], ['example.bar', 'example.foo'])
        }
    }
}).export(module);
