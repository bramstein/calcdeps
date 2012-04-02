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
  }
}).export(module);
