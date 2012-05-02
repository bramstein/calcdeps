## A Node.js port of Google Closure library calcdeps.py.

## Installation

    > npm install calcdeps -g

## Usage

     calcdeps [options]

## Options

<dl>
  <dt>-i, --input</dt>
  <dd>The inputs to calculate dependencies for. Valid values can be files or directories.</dd>
  <dt>-p, --path</dt>
  <dd>The paths that should be traversed to build the dependencies. Defaults to the current directory</dd>
  <dt>-d, --dep</dt>
  <dd>Directories or files that should be traversed to find required dependencies for the deps file. Does not generate dependency information for names provided by these files.</dd>
  <dt>-e, --exclude</dt>
  <dd>Files or directories to exclude from the --path and --input flags</dd>
  <dt>-o, --output_mode</dt>
  <dd>The type of output to generate from this script. Options are "list" for a list of filenames, "script" for a single script containing the contents of all the files, or "deps" to generate a deps.js file for all paths. Defaults to "list".</dd>
  <dt>--output_file</dt>
  <dd>If specified, write output to this path instead of writing to standard output.</dd>
</dl>
