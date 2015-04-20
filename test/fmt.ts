/// <reference path="../type_declarations/index.d.ts" />
import assert = require('assert');
import fs = require('fs');
import path = require('path');

import domlike = require('../index');

describe('domlike formatter', () => {
  var dirpath = path.join(__dirname, 'examples');
  fs.readdirSync(dirpath)
  .filter(file => file.match(/\.fmt/) != null)
  .forEach(filename => {
    var fmt_filepath = path.join(dirpath, filename);
    var original_filepath = fmt_filepath.replace(/\.fmt/, '');
    it(`should format ${original_filepath} into ${fmt_filepath}`, (callback) => {
      // read expected output
      var expected_output = fs.readFileSync(fmt_filepath, {encoding: 'utf8'}).trim();
      // parse original
      fs.createReadStream(original_filepath, {encoding: 'utf8'})
      .pipe(new domlike.Parser()).on('finish', function() {
        var output = this.document.toString();
        assert.equal(output, expected_output, `parse result does not match expected output.
          when parsed => ${output}
          but should  == ${expected_output}`);
        callback();
      });
    });
  })
});
