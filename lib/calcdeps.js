var async = require('async'),
    TokenStream = require('./TokenStream'),
    directoryUtils = require('./directory-utils'),
    fs = require('fs'),
    path = require('path');

var findJS = function (path, callback) {
    directoryUtils.walkFilter(path, function (file) {
        return /.*\.js$/i.test(file);
    }, callback);
};

function buildDependenciesHash(dependencies, callback) {
  var result = {};

  // Apart from the error handling we don't gain much from doing this async
  async.forEach(dependencies, function (dependency, callback) {
    async.forEach(dependency.provide, function (provide, callback) {
      if (result[provide]) {
        callback('Duplicate provide (' + provide + ') in (' + result[provide].path + ', ' + dependency.path + ')');
      } else {
        result[provide] = dependency;
        callback(null);
      }
    }, function (err) {
       callback(err);
    });
  }, function (err) {
    callback(err, result);
  });
}

function resolveDependencies(require, hash, resultList, seenList, callback) {
  var dep = hash[require];

  if (!dep) {
    callback('Missing provider for (' + require + ')');
  } else {
    if (!seenList[dep.path]) {
      seenList[dep.path] = true;
      async.forEachSeries(dep.require, function (subRequire, callback) {
        resolveDependencies(subRequire, hash, resultList, seenList, callback);
      }, function (err) {
        if (err) {
          callback(err);
        } else {
          resultList.push(dep.path);
          callback(null);
        }
      });
    } else {
      callback(null);
    }
  }
}

function calculateDependencies(paths, inputs, callback) {
  parseFiles(merge(paths, inputs), function (err, results) {
    if (err) {
      callback(err);
    } else {
      var inputFiles = results.filter(function (input) {
        return inputs.indexOf(input.path) !== -1;
      });

      buildDependenciesHash(results, function (err, searchHash) {
        if (err) {
          callback(err);
        } else {
          // Find Base.js
          async.detect(results, function (item, callback) {
            callback(!!item.base);
          }, function (base) {
            var resultList = [],
                seenList = {};
            if (base) {
              // Put Closure Library base.js first as everything depends on it
              resultList.push(base.path);
              async.forEachSeries(inputFiles, function (inputFile, callback) {
                seenList[inputFile.path] = true;
                async.forEachSeries(inputFile.require, function (require, callback) {
                  resolveDependencies(require, searchHash, resultList, seenList, callback);
                }, function (err) {
                  if (err) {
                    callback(err);
                  } else {
                    resultList.push(inputFile.path);
                    callback(null);
                  }
                });
              }, function (err) {
                if (err) {
                  callback(err);
                } else {
                  callback(null, resultList);
                }
              });
            } else {
              callback('Closure Library base.js not found.');
            }
          });
        }
      });
    }
  });
}

function parseFiles(paths, callback) {
    async.map(paths, function (path, callback) {
        var readStream = null,
            tokenStream = null,
            result = {
                require: [],
                provide: []
            };

        if (Array.isArray(path)) {
            parseFiles(path, callback);
        } else {
            readStream = fs.createReadStream(path, {
                flags: 'r'
            });

            tokenStream = new TokenStream();
            tokenStream.addRule(/^goog\.require\s*\(\s*[\'\"]([^\)]+)[\'\"]\s*\)/gm, 'require');
            tokenStream.addRule(/^goog\.provide\s*\(\s*[\'\"]([^\)]+)[\'\"]\s*\)/gm, 'provide');
            tokenStream.addRule(/^var goog = goog \|\| \{\};/gm, 'base');
            tokenStream.on('token', function (name, matches) {
                if (name === 'base') {
                    result.base = true;
                } else {
                    result[name].push(matches[0]);
                }
            });
            tokenStream.on('end', function () {
                result.path = path;
                callback(null, result);
            });
            readStream.pipe(tokenStream);
        }
    }, callback);
}

// Merges two or more arrays of strings or numbers, return order not guaranteed.
function merge() {
  var hash = {},
      i = 0,
      len = arguments.length,
      a = null;

  for (; i < len; i += 1) {
    arguments[i].forEach(function (v) {
      if (!hash[v]) {
        hash[v] = true;
      }
    });
  }
  return Object.keys(hash);
}

function printDependencies(paths, dependencies, callback) {
  var excludeSet = {};

  dependencies.forEach(function (dependency) {
    excludeSet[dependency] = true;
  });

  parseFiles(merge(paths, dependencies), function (err, results) {
    if (err) {
      callback(err);
    } else {
      // Find the first file that is recognized as Closure base.js
      async.detect(results, function (result, callback) {
        callback(!!result.base);
      }, function (base) {
        if (base) {
          callback(null, results.filter(function (dependency) {
            dependency.relativePath = relativePath(base.path, dependency.path);
            return !dependency.base && !excludeSet[dependency.path];
          }));
        } else {
          callback('Did not find Google Closure base.js');
        }
      });
    }
  });
}

function relativePath(from, to) {
  return directoryUtils.relative(path.dirname(from) + '/', to);
}

function calcdeps(options, callback) {
  var inputs = options.input,
      paths = options.path,
      excludes = options.exclude,
      dependencies = options.dep,
      output_mode = options.output_mode,
      excludeSet = {};

  excludes.forEach(function (exclude) {
    excludeSet[exclude] = true;
  });

  async.concat(paths, findJS, function (err, paths) {
    if (err) {
      callback(err);
    } else {
      paths = paths.filter(function (path) {
        return !excludeSet[path];
      });

      if (output_mode === 'deps') {
        async.concat(dependencies, findJS, function (err, dependencies) {
          if (err) {
            callback(err);
          } else {
            printDependencies(paths, dependencies, callback);
          }
        });
      } else if (output_mode === 'script' || output_mode === 'list') {
        async.concat(inputs, function (input, callback) {
          // Input can both be a dir or a filename, so we lstat here to make sure
          // we don't pass a file to findJS. Perhaps findJS can do this sanity check
          // itself.
          // FIXME: This doesn't test whether an input file (so not a directory) is
          // a JavaScript file.
          fs.lstat(path.resolve(input), function (err, stat) {
            if (err) {
              callback(err);
            } else {
              if (stat.isDirectory()) {
                findJS(input, callback);
              } else {
                callback(null, input);
              }
            }
          });
        }, function (err, inputs) {
          if (err) {
            callback(err);
          } else {
            // Filter the input list for excludes
            inputs.filter(function (input) {
              return !excludeSet[input];
            });

            calculateDependencies(paths, inputs, function (err, results) {
              if (output_mode === 'list') {
                callback(err, results);
              } else {
              }
            });
          }
        });
      } else {
        callback('Mode ' + output_mode + ' is not supported.');
      }
    }
  });
}

module.exports = calcdeps;
