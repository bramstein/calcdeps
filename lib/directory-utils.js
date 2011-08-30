var async = require('async'),
    fs = require('fs'),
    path = require('path');

function walk(dir, callback) {
    return walkDirFilter(dir, function () { return true; }, callback);
}

function walkFilter(dir, filterFn, callback) {
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
                            path: p,
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
                                walkFilter(stat.path, filterFn, callback);
                            } else {
                                callback(null, stat.path);
                            }
                        }, callback);
                    });
                }
            });
        }
    });
}

module.exports.walk = walk;
module.exports.walkFilter = walkFilter;

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
exports.relative = function(from, to) {
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
