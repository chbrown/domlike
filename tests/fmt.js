import assert from 'assert';
import {describe, it} from 'mocha';
import {readdirSync, readFileSync, createReadStream} from 'fs';
import {join} from 'path';
import {Parser} from '../';

describe('domlike formatter', () => {
  var dirpath = join(__dirname, 'examples');
  readdirSync(dirpath)
  .filter(file => file.match(/\.fmt/) != null)
  .forEach(filename => {
    var fmt_filepath = join(dirpath, filename);
    var original_filepath = fmt_filepath.replace(/\.fmt/, '');
    it(`should format ${original_filepath} into ${fmt_filepath}`, (callback) => {
      // read expected output
      var expected_output = readFileSync(fmt_filepath, {encoding: 'utf8'}).trim();
      // parse original
      createReadStream(original_filepath, {encoding: 'utf8'})
      .pipe(new Parser()).on('finish', function() {
        var output = this.document.toString();
        assert.equal(output, expected_output, `parse result does not match expected output.
          when parsed => ${output}
          but should  == ${expected_output}`);
        callback();
      });
    });
  });
});
