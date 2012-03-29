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
