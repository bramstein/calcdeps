#!/usr/bin/env node

var calcdeps = require('../lib/calcdeps'),
    program = require('commander');

function files(value) {
  return value.split(':');
};

/*
calcdeps.js --input src/init.js:src/modules.js:treesaver/src/core.js --path src --dep lib/closure
*/
program
  .option('-i, --input <files>', 'The inputs to calculate dependencies for. Valid values can be files or directories.', files)
  .option('-p, --path <paths>', 'The paths that should be traversed to build the dependencies.', files)
  .option('-d, --dep <deps>', 'Directories or files that should be traversed to find required dependencies for the deps file. Does not generate dependency information for names provided by these files.', files)
  .option('-e, --exclude [excludes]', 'Files or directories to exclude from the --path and --input flags.', files)
  .option('-o, --output_file [file]', 'If specified, write output to this path instead of writing to standard output.');

program.on('--help', function () {
  console.log('Multiple <files>, <paths>, <deps>, or <excludes> entries should be ":" separated.');
});

program.parse(process.argv);

if (program.input && program.path && program.dep) {
  calcdeps({
    input: program.input,
    paths: program.path,
    deps: program.dep,
    excludes: program.exclude,
    outputFile: program.output_file
  });
}


