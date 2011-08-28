var async = require('async'),
    TokenStream = require('./TokenStream'),
    directoryUtils = require('./directory-utils'),
    fs = require('fs');

var findJS = function (path, callback) {
    directoryUtils.walkFilter(path, function (file) {
        return /.*\.js$/i.test(file);
    }, callback);
};

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
            tokenStream.addRule(/goog\.require\s*\(\s*[\'\"]([^\)]+)[\'\"]\s*\)/g, 'require');
            tokenStream.addRule(/goog\.provide\s*\(\s*[\'\"]([^\)]+)[\'\"]\s*\)/g, 'provide');
            tokenStream.addRule(/var goog = goog \|\| \{\};/g, 'base');
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

function calcdeps(options) {
  var input = options.input || [],
      paths = options.paths || [],
      excludes = options.excludes || [],
      deps = options.deps || [],
      outputFile = options.outputFile;

  async.map([
      paths,
      deps
  ], function (item, callback) {
      async.concat(item, findJS, callback);
  }, function (err, results) {
      if (err) {
          console.log(err);
      } else {
          var paths = results[0],
              deps = results[1];

          paths.filter(function (path) {
              return excludes.indexOf(path) === -1;
          });

          async.map([
              paths,
              deps
          ], parseFiles, function (err, results) {
              console.log(JSON.stringify(results, null, '  '));
          });
      }
  });
}

module.exports = calcdeps;
