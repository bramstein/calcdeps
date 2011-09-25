var util = require('util'),
    Stream = require('stream').Stream;

function TokenStream() {
    this.readable = true;
    this.writable = true;
    this.rules = [];
    this.buffer = '';
}

util.inherits(TokenStream, Stream);

TokenStream.prototype.addRule = function (regexp, name) {
    this.rules.push({
        regexp: regexp,
        name: name
    });
};

TokenStream.prototype.write = function (chunk) {
    var lastIndex = 0;
    // We convert the chunk to UTF8 here. Ideally we would
    // like to keep an internal Buffer, but using regular
    // expressions makes that difficult.
    this.buffer += chunk.toString('utf8');

    // Go through each rule and find the first matching
    // regular expression. Match until exhaustion, and then
    // we consider that part of the buffer done so we discard
    // it and move on to the next regular expression.
    this.rules.forEach(function (rule) {
        var m;

        while ((m = rule.regexp.exec(this.buffer))) {
            this.emit('data', rule.name, m.slice(1, m.length));
            lastIndex = Math.max(rule.regexp.lastIndex, lastIndex);
        }
        rule.regexp.lastIndex = 0;
    }, this);

    this.buffer = this.buffer.slice(lastIndex, this.buffer.length);
};

TokenStream.prototype.end = function () {
    this.emit('end');
};

module.exports = TokenStream;
