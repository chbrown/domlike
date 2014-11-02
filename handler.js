/*jslint node: true */
var logger = require('loge');
var nodeTypes = require('./types');
var Node = require('./node');

var Handler = module.exports = function(callback) {
  /** From the docs: https://github.com/fb55/htmlparser2/wiki/Parser-options

      onopentag(<str> name, <obj> attributes)
      onopentagname(<str> name)
      onattribute(<str> name, <str> value)
      ontext(<str> text)
      onclosetag(<str> name)
      onprocessinginstruction(<str> name, <str> data)
      oncomment(<str> data)
      oncommentend()
      oncdatastart()
      oncdataend()
      onerror(<err> error)
      onreset()
      onend()
  */
  this.callback = callback;

  // initialize with a single special document node on the stack
  this.document = new Node(nodeTypes.DOCUMENT_NODE);
  this.document.childNodes = [];
  this._stack = [this.document];
};

Handler.prototype.top = function() {
  // a.k.a., peek()
  return this._stack[this._stack.length - 1];
};

Handler.prototype._flush = function() {
  var node = this._stack.pop();
  var top = this.top();
  node.parentNode = top;
  top.childNodes.push(node);
};

// ##############
// Event handlers
// ##############

Handler.prototype.onreset = function() {
  logger.debug('domlike.Handler reset');
  Handler.call(this, this.callback);
};

Handler.prototype.onend = function() {
  if (this._stack.length > 1) {
    logger.error('Document closed with unfinished nodes on the stack');
  }
  logger.debug('domlike.Handler reached end of input');
  this.callback(null, this._stack[0]);
};

Handler.prototype.onerror = function(error) {
  logger.error('domlike.Handler encountered error: %s', error);
  this.callback(error);
};

Handler.prototype.onopentag = function(name, attribs) {
  // logger.debug('<%s>', name);
  var element = new Node(nodeTypes.ELEMENT_NODE);
  element.tagName = name;
  element.attributes = attribs;
  element.childNodes = [];
  element.ownerDocument = this.document;

  this._stack.push(element);
};

Handler.prototype.onclosetag = function(name) {
  // logger.debug('<%s/>', name);
  //if (elem.name !== name) this._handleCallback(Error('Tagname didn't match!'));
  this._flush();
};

Handler.prototype.ontext = function(data) {
  var top = this.top();
  // text nodes are not stored on the stack because they are not closed,
  // so we consider the last child of the top element for merging
  // logger.debug('top: %j', top);
  var current = top.childNodes[top.childNodes.length - 1];
  if (current && current.nodeType == nodeTypes.TEXT_NODE) {
    current.nodeValue += data;
  }
  else {
    var node = new Node(nodeTypes.TEXT_NODE, data);
    top.childNodes.push(node);
  }
};

Handler.prototype.oncomment = function(data) {
  // just like ontext -- should it be?
  var top = this.top();
  var current = top.childNodes[top.childNodes.length - 1];
  if (current && current.nodeType == nodeTypes.COMMENT_NODE) {
    current.nodeValue += data;
  }
  else {
    var node = new Node(nodeTypes.COMMENT_NODE, data);
    top.childNodes.push(node);
  }
};
// Handler.prototype.oncommentend = Handler.prototype._flush;

Handler.prototype.oncdatastart = function() {
  logger.debug('domlike.Handler starting cdata');
  var cdata = new Node(nodeTypes.CDATA_SECTION_NODE, '');
  // cdata.childNodes = [];

  this._stack.push(cdata);
};

Handler.prototype.oncdataend = function() {
  logger.debug('domlike.Handler ending cdata');
  this._flush();
};

Handler.prototype.onprocessinginstruction = function(name, data) {
  /** Processing instructions are emitted as a single event, so they never get
  put on the stack; instead, they get added directly to the current top node,
  which should only ever be a DocumentNode, but we don't enforce that.
  */
  var processing_instruction = new Node(nodeTypes.PROCESSING_INSTRUCTION_NODE, data);

  var top = this.top();
  processing_instruction.parentNode = top;
  top.childNodes.push(processing_instruction);
};
