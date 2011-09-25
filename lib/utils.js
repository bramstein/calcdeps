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
 * The code below is taken from Node 0.5.4 because 0.4.x does not have this function
 * License below applies.
 */

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// path.relative(from, to)
// posix version
module.exports.relative = function(from, to) {
  from = path.resolve(from).substr(1);
  to = path.resolve(to).substr(1);


  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

/**
 * Returns the relative from file `from` to file `to`.
 */
module.exports.relativePath = function (from, to) {
  return directoryUtils.relative(path.dirname(from) + '/', to);
}

function walkdir(dir, filterFn, callback) {
  fs.lstat(dir, function (err, stat) {
    if (err) {
      callback(err);
    } else if (stat.isDirectory()) {
      fs.readdir(dir, function (err, files) {
        if (err) {
          callback(err);
        } else {
          async.concat(files, function (file, callback) {
            var p = path.join(dir, file);

            fs.lstat(p, function (err, stat) {
              if (err) {
                callback(err);
              } else {
                callback(err, {
                  path: path.resolve(p),
                  isDirectory: stat.isDirectory()
                });
              }
            });
          }, function (err, stats) {
            if (err) {
              callback(err);
            } else {
              async.filter(stats, function (stat, callback) {
                callback(stat.isDirectory || filterFn(stat.path));
              }, function (stats) {
                async.concat(stats, function (stat, callback) {
                  if (stat.isDirectory) {
                    walkdir(stat.path, filterFn, callback);
                  } else {
                    callback(null, stat.path);
                  }
                }, callback);
              });
            }
          });
        }
      });
    } else if (filterFn(dir)) {
      callback(null, [dir]);
    } else {
      callback(null, []);
    }
  });
};

module.exports.walkdir = walkdir;
