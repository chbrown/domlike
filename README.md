# domlike

For use with [htmlparser2](https://github.com/fb55/htmlparser2), which is great as a parser, but kind of got off the tracks with its `DomHandler` implementation, which was fractured into two repositories, [fb55/domhandler](https://github.com/fb55/domhandler) and [fb55/DomUtils](https://github.com/fb55/DomUtils), and uses arbitrary names in its implementation.

This repository, `domlike`, replaces both [`DomHandler`](https://github.com/fb55/domhandler) and [`DomUtils`](https://github.com/fb55/DomUtils) (as well as the strange and premature [`domelementtype`](https://github.com/fb55/domelementtype)), and seeks to implement most of the DOM2/DOM3 standard for [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node).

## Quickstart

Install:

    npm install --save domlike htmlparser2

Use:

    var request = require('request');
    var htmlparser2 = require('htmlparser2');
    var domlike = require('domlike');

    request.get('http://henrian.com', function(err, res, body) {
      if (err) throw err;

      var handler = new domlike.Handler(function(err, document) {
        if (err) throw err;

        // collect all anchors (<a> elements) and print out their text and url
        // in Markdown syntax
        document.queryPredicateAll(function(node) {
          return node.tagName == 'a';
        }).forEach(function(node) {
          console.log('[%s](%s)', node.textContent, node.attributes.href);
        });

        console.log(document.textContent);
      });

      var parser = new htmlparser2.Parser(handler, {decodeEntities: true});
      parser.write(body);
      parser.done();
    });


TODO: Compare `htmlfmt` output with [xmlformat](http://www.kitebird.com/software/xmlformat/)'s.


## License

Copyright 2014-2015 Christopher Brown. [MIT Licensed](http://chbrown.github.io/licenses/MIT/#2014-2015).
