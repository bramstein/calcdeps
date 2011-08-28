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
