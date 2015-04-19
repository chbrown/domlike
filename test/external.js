/// <reference path="../type_declarations/index.d.ts" />
var assert = require('assert');
var request = require('request');
var domlike = require('../index');
describe('external test', function () {
    it('should get links from personal webpage', function (callback) {
        request.get('http://henrian.com').pipe(new domlike.Parser()).on('finish', function () {
            var gplus_anchors = this.document.queryPredicateAll(function (node) {
                return node.tagName == 'a' && node.attributes.href == 'https://plus.google.com/+ChristopherBrownPlus';
            });
            assert.equal(gplus_anchors.length, 1, 'There should be exactly one link to my Google+ page.');
            assert.equal(gplus_anchors[0].textContent, 'Google+', 'The link to my Google+ page should be called "Google+"');
            callback();
        });
    });
});
