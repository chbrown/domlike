/*jslint node: true */
var assert = require('assert');
var util = require('util');

var domlike = require('..');

var htmlparser2 = require('htmlparser2');
var request = require('request');

var run = function(callback) {
  request.get('http://henrian.com', function(err, res, body) {
    if (err) return callback(err);

    var handler = new domlike.Handler(function(err, document) {
      if (err) return callback(err);

      var anchors = document.allDFS(function(node) {
        return node.tagName == 'a';
      }).filter(function(node) {
        return node.attributes.href == 'https://plus.google.com/+ChristopherBrownPlus';
      });

      assert.equal(anchors.length, 1,
        'There should be exactly one link to my Google+ page.');
      assert.equal(anchors[0].textContent, 'Google+',
        'The link to my Google+ page should be called "Google+"');

      callback();
    });

    var parser = new htmlparser2.Parser(handler, {decodeEntities: true});
    parser.write(body);
    parser.done();
  });
};

run(function(err) {
  if (err) throw err;
});
