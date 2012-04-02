var async = require('async'),
    fs = require('fs'),
    path = require('path');

/**
 * Convert an Array of Strings to an object boolean values.
 *
 * @param {!Array.<!string>} array The array to convert to a boolean
 * @return {!Object}
 */
module.exports.toObject = function (array) {
    var result = {};

    array.forEach(function (item) {
        result[item] = true;
    });
    return result;
};

/**
 * Merges two or more arrays of strings or numbers.
 * The return order is not guaranteed.
 */
module.exports.merge = function () {
  var result = {},
      i = 0,
      len = arguments.length;

  for (; i < len; i += 1) {
    arguments[i].forEach(function (v) {
      if (!result[v]) {
        result[v] = true;
      }
    });
  }
  return Object.keys(result);
}

/**
 * Returns the relative from file `from` to file `to`.
 */
module.exports.relativePath = function (from, to) {
  return path.relative(path.dirname(from) + '/', to);
}