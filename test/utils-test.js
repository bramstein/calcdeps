var vows = require('vows'),
    assert = require('assert'),
    utils = require('../lib/utils');

vows.describe('utils').addBatch({
  'toObject': {
    topic: utils.toObject(['hello world', 'something', 'hello world']),
    'has two keys': function (topic) {
      assert.lengthOf(Object.keys(topic), 2);
    },
    'has the right properties': function (topic) {
      assert.include(topic, 'hello world');
      assert.include(topic, 'something');
    }
  },
  'merge': {
    topic: utils.merge(['1', '2'], ['2', '3'], ['3', '4']),
    'has four elements': function (topic) {
      assert.lengthOf(topic, 4);
    },
    'has the right values': function (topic) {
      assert.include(topic, '1');
      assert.include(topic, '2');
      assert.include(topic, '3');
      assert.include(topic, '4');
    }
  },
  'walkdir - all files': {
    topic: function () {
      utils.walkdir('./test/data', function () {
        return true;
      }, this.callback);
    },
    'did not return an error': function (err, result) {
      assert.isNull(err);
    },
    'found five files': function (err, result) {
      assert.lengthOf(result, 5);
    }
  },
  'walkdir - *.js filter': {
    topic: function () {
      utils.walkdir('./test/data', function (file) {
        return /.*\.js$/i.test(file);
      }, this.callback);
    },
    'did not return an error': function (err, result) {
      assert.isNull(err);
    },
    'found four *.js files': function (err, result) {
	assert.lengthOf(result, 4);
    }
  },
  'walkdir - nonexistent dir': {
    topic: function () {
      utils.walkdir('nope', function () {
        return true;
      }, this.callback);
    },
    'returned error': function (err, result) {
      assert.isNotNull(err);
    }
  },
  'walkdir - not a dir': {
    topic: function () {
      utils.walkdir('./test/data/README.md', function () {
        return true;
      }, this.callback);
    },
    'did not return an error': function (err, result) {
      assert.isNull(err);
    },
    'found one file': function (err, result) {
      assert.lengthOf(result, 1);
    }
  },
  'walkdir - not a dir and excluded': {
    topic: function () {
      utils.walkdir('./test/data/README.md', function (file) {
        return /.*\.js$/i.test(file);
      }, this.callback);
    },
    'did not return an error': function (err, result) {
      assert.isNull(err);
    },
    'returned an empty result': function (err, result) {
      assert.isEmpty(result);
    }
  }
}).export(module);
