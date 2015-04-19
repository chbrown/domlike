/// <reference path="../type_declarations/index.d.ts" />
import assert = require('assert');
import htmlparser2 = require('htmlparser2');
import request = require('request');

import domlike = require('../index');

describe('external test', () => {
  it('should get links from personal webpage', (callback) => {
    request.get('http://henrian.com').pipe(new domlike.Parser()).on('finish', function() {
      var gplus_anchors = this.document.queryPredicateAll(node => {
        return node.tagName == 'a' && node.attributes.href == 'https://plus.google.com/+ChristopherBrownPlus';
      });

      assert.equal(gplus_anchors.length, 1,
        'There should be exactly one link to my Google+ page.');
      assert.equal(gplus_anchors[0].textContent, 'Google+',
        'The link to my Google+ page should be called "Google+"');

      callback();
    });
  });
});
