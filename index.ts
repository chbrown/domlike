/// <reference path="type_declarations/DefinitelyTyped/node/node.d.ts" />
/// <reference path="type_declarations/DefinitelyTyped/htmlparser2/htmlparser2.d.ts" />
import {resolve} from 'url';
import * as stream from 'stream';
import * as htmlparser2 from 'htmlparser2';
import * as events from 'events';

//// export module domlike {

export enum NodeType {
  ELEMENT_NODE = 1,
  ATTRIBUTE_NODE,
  TEXT_NODE,
  CDATA_SECTION_NODE,
  ENTITY_REFERENCE_NODE,
  ENTITY_NODE,
  PROCESSING_INSTRUCTION_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_TYPE_NODE,
  DOCUMENT_FRAGMENT_NODE,
  NOTATION_NODE,
}

function flatMap<T, R>(elements: T[], callback: (element: T, index: number, array: T[]) => R[]): R[] {
  var arrays: R[][] = elements.map(callback);
  return Array.prototype.concat.apply([], arrays);
}

function sum<T>(array: Array<T>, fn: (item: T) => number) {
  return array.map(fn).reduce((a, b) => a + b, 0);
}

/**
For the document itself, `nodeValue` returns null.
For text, comment, and CDATA nodes, `nodeValue` returns the content of the node.
For attribute nodes, `nodeValue` returns the value of the attribute.
*/
export class Node {
  parentNode: Node;
  tagName: string;
  name: string;
  target: string;
  attributes: {[index: string]: string} = {};
  childNodes: Node[];
  ownerDocument: Document;
  constructor(public nodeType: NodeType, public nodeValue: any) { }

  /**
  Returns the index of a child among its self-reported parent's childNodes

  Two things could go wrong, throwing errors:
  1) The given node does not have a parentNode
  2) The node's self-reported parentNode does not think this node is one of its childNodes
  */
  private _indexWithinParent(): number {
    var parentNode = this.parentNode;
    if (parentNode === undefined) {
      throw new Error('Orphan nodes have no index within parent.');
    }
    var index = parentNode.childNodes.indexOf(this);
    if (index === -1) {
      throw new Error('Illegitimate children have no index within parent.');
    }
    return index;
  }

  getElementById(id: string): Node {
    return this.queryPredicate(node => node.attributes && (node.attributes['id'] == id))
  }
  getElementsByTagName(tagName: string): Node[] {
    return this.queryPredicateAll(node => node.tagName == tagName);
  }
  getElementByTagName(tagName: string): Node {
    return this.queryPredicate(node => node.tagName == tagName);
  }
  getElementsByClassName(className: string): Node[] {
    return this.queryPredicateAll(node => node.attributes && (node.attributes['class'] == className))
  }
  getElementByClassName(className: string): Node {
    return this.queryPredicate(node => node.attributes && (node.attributes['class'] == className))
  }

  /**
  TODO: maybe use https://github.com/mdevils/node-css-selector-parser ?
  */
  querySelector(selector: string): Node {
    throw new Error('Not yet implemented');
  }
  querySelectorAll(selector: string): Node[] {
    throw new Error('Not yet implemented');
  }

  // ####################
  // Non-standard methods
  // ####################

  /**
  queryPredicateAll is like querySelectorAll, except that instead of a CSS
  selector, it takes a `predicate` function(node) => boolean, and returns the
  first node below `this` (potentially `this`) for which `predicate(node)`
  returns true. Return undefined if no node matches.

  This takes a depth-first-search strategy:

  1. try on the current node
  2. recurse on the current node's children
  */
  queryPredicate(predicate: (node: Node) => boolean): Node {
    if (predicate(this)) {
      return this;
    }

    if (this.nodeType == NodeType.ELEMENT_NODE ||
        this.nodeType == NodeType.DOCUMENT_NODE) {
      for (var i = 0, childNode: Node; (childNode = this.childNodes[i]); i++) {
        var result = childNode.queryPredicate(predicate);
        if (result) return result;
      }
    }
  }
  /**
  queryPredicateAll is like querySelectorAll, except that instead of a CSS
  selector, it takes a `predicate` function(node) => boolean, and accumulates
  and returns all of the nodes below `this` (potentially including `this`) for
  which `predicate(node)` returns true.
  */
  queryPredicateAll(predicate: (node: Node) => boolean): Node[] {
    var results = [];
    if (predicate(this)) {
      results.push(this);
    }

    if (this.nodeType == NodeType.ELEMENT_NODE ||
        this.nodeType == NodeType.DOCUMENT_NODE) {
      for (var i = 0, childNode: Node; (childNode = this.childNodes[i]); i++) {
        var childResults = childNode.queryPredicateAll(predicate);
        // extend results with all of the sub-results
        Array.prototype.push.apply(results, childResults);
      }
    }

    return results;
  }

  get baseURI() {
    throw new Error('Not yet implemented');
  }

  /**
  return this node's first childNode, or null if it has no children.
  */
  get firstChild() {
    // node.childNodes is a POJO
    return this.childNodes[0] || null;
  }

  /**
  return this node's last childNode, or null if it has no children.
  */
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
  }

  get localName() {
    throw new Error('Not yet implemented');
  }

  get namespaceURI() {
    throw new Error('Not yet implemented');
  }

  /** node.nextSibling returns this node's parentNode's childNode directly following this node.

  Throws an error if this node has no parent or if the parent does not claim this node.

  Returns null if this node is its parentNode's lastChild.
  */
  get nextSibling() {
    var i = this._indexWithinParent();
    return this.parentNode[i + 1] || null;
  }

  /** node.nodeName depends on this node's type.

  See https://developer.mozilla.org/en-US/docs/Web/API/Node.nodeName
  */
  get nodeName(): string {
    if (this.nodeType == NodeType.ELEMENT_NODE) {
      return this.tagName;
    }
    else if (this.nodeType == NodeType.ATTRIBUTE_NODE) {
      return this.name;
    }
    else if (this.nodeType == NodeType.TEXT_NODE) {
      return '#text';
    }
    else if (this.nodeType == NodeType.CDATA_SECTION_NODE) {
      return '#cdata-section';
    }
    else if (this.nodeType == NodeType.ENTITY_REFERENCE_NODE) {
      throw new Error('EntityReferenceNode.nodeName is not yet implemented');
    }
    else if (this.nodeType == NodeType.ENTITY_NODE) {
      throw new Error('EntityNode.nodeName is not yet implemented');
    }
    else if (this.nodeType == NodeType.PROCESSING_INSTRUCTION_NODE) {
      return this.target;
    }
    else if (this.nodeType == NodeType.COMMENT_NODE) {
      return '#comment';
    }
    else if (this.nodeType == NodeType.DOCUMENT_NODE) {
      return '#document';
    }
    else if (this.nodeType == NodeType.DOCUMENT_TYPE_NODE) {
      return this.name;
    }
    else if (this.nodeType == NodeType.DOCUMENT_FRAGMENT_NODE) {
      return '#document-fragment';
    }
    else if (this.nodeType == NodeType.NOTATION_NODE) {
      throw new Error('NotationNode.nodeName is not yet implemented');
    }
    else {
      throw new Error('Node with unrecognized nodeType has no nodeName');
    }
  }

  /** node.href returns this node's [href] attribute as a URL resolved
  against the owner document's URL iff node is an anchor element.

  Otherwise returns null.

  TODO: .href should really only be defined on Element, and only tagName: 'a' elements, at that.
  */
  get href() {
    if (this.nodeType == NodeType.ELEMENT_NODE && this.tagName.toLowerCase() == 'a') {
      var base_url = this.ownerDocument.URL || '';
      var href_attr = this.attributes['href'];
      return resolve(base_url, href_attr);
    }
  }

  /** node.parentElement returns this node's parentNode iff:
  1) it (node.parentNode) exists, and
  2) it (node.parentNode) is an ElementNode

  Otherwise returns null.
  */
  get parentElement() {
    var parentNode = this.parentNode;
    if (parentNode && parentNode.nodeType == NodeType.ELEMENT_NODE) {
      return parentNode;
    }
    return null;
  }

  get prefix() {
    throw new Error('Not yet implemented');
  }

  /**
  Return this node's parentNode's childNode directly before this node.
  Throws an error if this node has no parent or if the parent does not claim this node.
  Returns null if this node is its parentNode's firstChild.
  */
  get previousSibling() {
    var i = this.parentNode._indexWithinParent();
    return this.parentNode[i - 1] || null;
  }

  get textContent() {
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.textContent
    if (this.nodeType == NodeType.DOCUMENT_NODE ||
        this.nodeType == NodeType.DOCUMENT_TYPE_NODE ||
        this.nodeType == NodeType.NOTATION_NODE) {
      return null;
    }
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.nodeValue
    else if (this.nodeType == NodeType.CDATA_SECTION_NODE ||
        this.nodeType == NodeType.COMMENT_NODE ||
        this.nodeType == NodeType.PROCESSING_INSTRUCTION_NODE ||
        this.nodeType == NodeType.TEXT_NODE) {
      return this.nodeValue;
    }
    else {
      return this.childNodes.map(function(childNode) {
        return childNode.textContent;
      }).join('');
    }
  }
  set textContent(value) {
    this.childNodes = [new Text(value)];
  }

  get children() {
    return this.childNodes.filter(function(node) {
      return node.nodeType == NodeType.ELEMENT_NODE;
    });
  }
  set children(childNodes) {
    var self = this;
    childNodes.forEach(function(childNode) {
      childNode.parentNode = self;
    });
    this.childNodes = childNodes;
  }

  /**
  toString() returns a string of XML/HTML, using XMLSerializer.default (which
  sets indent='  ' and inlineLimit=40).
  */
  toString() {
    return XMLSerializer.default.serializeToString(this);
  }
  /**
  toJSON() returns an impoverished but still DOM-like structure
  */
  toJSON() {
    return {
      nodeType: NodeType[this.nodeType],
      nodeValue: this.nodeValue,
    };
  }
}
export class Document extends Node {
  constructor(public URL: string, public childNodes = []) { super(NodeType.DOCUMENT_NODE, null) }

  toJSON() {
    return {
      nodeType: NodeType[this.nodeType],
      nodeValue: this.nodeValue,
      childNodes: this.childNodes,
    };
  }
}
export class Element extends Node {
  constructor(public tagName: string,
              public attributes: {[index: string]: string} = {},
              public ownerDocument = null,
              public childNodes = []) {
    super(NodeType.ELEMENT_NODE, null);
  }

  openTag() {
    // Create a list of space-separated attr="value" strings from each attribute
    var attrs = Object.keys(this.attributes).map(key => `${key}="${this.attributes[key]}"`);
    // TODO: escape quotes in attribute value
    var tagParts = [this.tagName].concat(attrs);
    return `<${tagParts.join(' ')}>`;
  }
  closeTag() {
    return `</${this.tagName}>`;
  }

  toJSON() {
    return {
      nodeType: NodeType[this.nodeType],
      nodeValue: this.nodeValue,
      tagName: this.tagName,
      attributes: this.attributes,
      childNodes: this.childNodes,
    };
  }
}
// CharacterData is an abstract class
export class CharacterData extends Node { }
export class Text extends CharacterData {
  constructor(nodeValue: string) {
    super(NodeType.TEXT_NODE, nodeValue);
  }
  toString() {
    return <string>this.nodeValue;
  }
}
export class Comment extends CharacterData {
  constructor(nodeValue: string) {
    super(NodeType.COMMENT_NODE, nodeValue);
  }
  toString() {
    return `<!--${this.nodeValue}-->`;
  }
}
export class ProcessingInstruction extends CharacterData {
  constructor(nodeValue: string) {
    super(NodeType.PROCESSING_INSTRUCTION_NODE, nodeValue);
  }
  toString() {
    return `<${this.nodeValue}>`;
  }
}
export class CDATASection extends CharacterData {
  constructor(nodeValue: string) {
    super(NodeType.CDATA_SECTION_NODE, nodeValue);
  }
  toString() {
      return `<![CDATA[${this.nodeValue}]]>`;
  }
}

/** From the docs: https://github.com/fb55/htmlparser2/wiki/Parser-options

All callbacks return void.

    onopentag(name: string, attribs: {[index: string]: string})
    onopentagname(name: string)
    onattribute(name: string, value: string)
    ontext(text: string)
    onclosetag(name: string)
    onprocessinginstruction(name: string, data: string)
    oncomment(data: string)
    oncommentend()
    oncdatastart()
    oncdataend()
    onerror(error: Error)
    onreset()
    onend()
*/
export class Handler extends events.EventEmitter implements htmlparser2.Handler {
  private _stack: Node[];
  document: Document;

  constructor(URL: string = '/') {
    super();
    // initialize with a single special document node on the stack
    this.document = new Document(URL);
    this._stack = [this.document];
  }

  private get _stackTop() {
    return this._stack[this._stack.length - 1];
  }

  onreset() {
    throw new Error('domlike.Handler:onreset is not supported');
  }
  onend() {
    // throw new Error('domlike.Handler:onend is not supported');
    if (this._stack.length > 1) {
      throw new Error('domlike.Handler:end reached with unfinished nodes on the stack');
    }
    // this.callback(this.document); // == this._stack[0]
    this.emit('end', this.document);
  }
  onerror(error: Error) {
    throw new Error(`domlike.Handler:onerror: ${error}`);
  }
  onopentag(name: string, attribs: {[index: string]: string}) {
    var element = new Element(name, attribs, this.document);
    this._stack.push(element);
  }
  onclosetag(name: string) {
    // console.error(`>> closetag ${name}`);
    var node = this._stack.pop();
    if (name !== node.tagName) {
      throw new Error(`tagName of closed tag, "${name}", does not match tagName of top tag on stack, "${node.tagName}"`);
    }
    node.parentNode = this._stackTop;
    this._stackTop.childNodes.push(node);
  }
  onattribute(name: string, value: string) {
    // no-op
  }
  ontext(text: string) {
    // console.error(`text ${text}`);
    var top = this._stackTop;
    // text nodes are not stored on the stack because they are not closed,
    // so we consider the last child of the top element for merging
    var current = top.childNodes[top.childNodes.length - 1];
    if (current && current.nodeType == NodeType.TEXT_NODE) {
      current.nodeValue += text;
    }
    else {
      var node = new Text(text);
      top.childNodes.push(node);
    }
  }
  oncomment(data: string) {
    // just like ontext -- should it be?
    var top = this._stackTop;
    var current = top.childNodes[top.childNodes.length - 1];
    if (current && current.nodeType == NodeType.COMMENT_NODE) {
      current.nodeValue += data;
    }
    else {
      var node = new Comment(data);
      top.childNodes.push(node);
    }
  }
  oncommentend() {
    // no-op
  }
  oncdatastart() {
    // console.error(`cdatastart`);
    var cdata = new CDATASection('');
    this._stack.push(cdata);
  }
  oncdataend() {
    // console.error(`cdataend`);
    throw new Error('Not yet implemented');
    // this._flush();
  }
  /** Processing instructions are emitted as a single event, so they never get
  put on the stack; instead, they get added directly to the current top node,
  which should only ever be a DocumentNode, but we don't enforce that.
  */
  onprocessinginstruction(name: string, data: string) {
    // console.error(`processinginstruction ${name} ${data}`);
    var processing_instruction = new ProcessingInstruction(data);
    processing_instruction.parentNode = this._stackTop;
    this._stackTop.childNodes.push(processing_instruction);
  }
}

export class XMLSerializer {
  constructor(public indentation: string, public inlineLimit: number) { }
  static default = new XMLSerializer('  ', 40);

  /**
  Return an Array of strings for a given Node.
  */
  private _serializeToLines(node: Node | Document | Element): string[] {
    if (node instanceof Document) {
      return flatMap(node.childNodes, node => this._serializeToLines(node)).filter(str => str.length > 0);
    }
    else if (node instanceof Element) {
      let childLines = flatMap(node.childNodes, node => this._serializeToLines(node)).filter(str => str.length > 0);
      // if the child is multiple lines already, or one line that's longer than `inlineLimit`, we indent over multiple lines
      var inline = (childLines.length <= 1) && (sum(childLines, str => str.length) < this.inlineLimit);
      // arrange the children
      childLines = inline ? [childLines.join('')] : childLines.map(line => this.indentation + line);
      childLines.unshift(node.openTag());
      childLines.push(node.closeTag());
      // join them if inline
      return inline ? [childLines.join('')] : childLines;
    }
    // all the other node types handle toString() just fine
    return [node.toString().trim()];
  }

  serializeToString(node: Node): string {
    return this._serializeToLines(node).join('\n');
  }
}

export interface ParserOptions extends stream.WritableOptions, htmlparser2.Options { }

export class Parser extends stream.Writable {
  handler = new Handler();
  parser: htmlparser2.Parser;
  constructor(opts: ParserOptions = {decodeEntities: true}) {
    super(opts);
    this.parser = new htmlparser2.Parser(this.handler, opts);
    this.on('finish', () => {
      this.emit('document', this.document);
    })
  }

  get document(): Document {
    return this.handler.document;
  }

  _write(chunk: Buffer | string, encoding: string, callback: (error?: Error) => void): void {
    this.parser.write(chunk.toString());
    callback();
  }
}

//// }
