/// <reference path="../type_declarations/index.d.ts" />
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var domlike = require('../index');
describe('domlike formatter', function () {
    var dirpath = path.join(__dirname, 'examples');
    fs.readdirSync(dirpath)
        .filter(function (file) { return file.match(/\.fmt/) != null; })
        .forEach(function (filename) {
        var fmt_filepath = path.join(dirpath, filename);
        var original_filepath = fmt_filepath.replace(/\.fmt/, '');
        it("should format " + original_filepath + " into " + fmt_filepath, function (callback) {
            // read expected output
            var expected_output = fs.readFileSync(fmt_filepath, { encoding: 'utf8' }).trim();
            // parse original
            fs.createReadStream(original_filepath, { encoding: 'utf8' })
                .pipe(new domlike.Parser()).on('finish', function () {
                var output = domlike.serializeNode(this.document, '  ', 40).join('\n').trim();
                assert.equal(output, expected_output, "parse result does not match expected output.\n          when parsed => " + output + "\n          but should  == " + expected_output);
                callback();
            });
        });
    });
});
