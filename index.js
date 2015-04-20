var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="type_declarations/DefinitelyTyped/node/node.d.ts" />
/// <reference path="type_declarations/DefinitelyTyped/htmlparser2/htmlparser2.d.ts" />
var url_1 = require('url');
var stream = require('stream');
var htmlparser2 = require('htmlparser2');
var events = require('events');
//// export module domlike {
(function (NodeType) {
    NodeType[NodeType["ELEMENT_NODE"] = 1] = "ELEMENT_NODE";
    NodeType[NodeType["ATTRIBUTE_NODE"] = 2] = "ATTRIBUTE_NODE";
    NodeType[NodeType["TEXT_NODE"] = 3] = "TEXT_NODE";
    NodeType[NodeType["CDATA_SECTION_NODE"] = 4] = "CDATA_SECTION_NODE";
    NodeType[NodeType["ENTITY_REFERENCE_NODE"] = 5] = "ENTITY_REFERENCE_NODE";
    NodeType[NodeType["ENTITY_NODE"] = 6] = "ENTITY_NODE";
    NodeType[NodeType["PROCESSING_INSTRUCTION_NODE"] = 7] = "PROCESSING_INSTRUCTION_NODE";
    NodeType[NodeType["COMMENT_NODE"] = 8] = "COMMENT_NODE";
    NodeType[NodeType["DOCUMENT_NODE"] = 9] = "DOCUMENT_NODE";
    NodeType[NodeType["DOCUMENT_TYPE_NODE"] = 10] = "DOCUMENT_TYPE_NODE";
    NodeType[NodeType["DOCUMENT_FRAGMENT_NODE"] = 11] = "DOCUMENT_FRAGMENT_NODE";
    NodeType[NodeType["NOTATION_NODE"] = 12] = "NOTATION_NODE";
})(exports.NodeType || (exports.NodeType = {}));
var NodeType = exports.NodeType;
function flatMap(elements, callback) {
    var arrays = elements.map(callback);
    return Array.prototype.concat.apply([], arrays);
}
function sum(array, fn) {
    return array.map(fn).reduce(function (a, b) { return a + b; }, 0);
}
/**
For the document itself, `nodeValue` returns null.
For text, comment, and CDATA nodes, `nodeValue` returns the content of the node.
For attribute nodes, `nodeValue` returns the value of the attribute.
*/
var Node = (function () {
    function Node(nodeType, nodeValue) {
        this.nodeType = nodeType;
        this.nodeValue = nodeValue;
        this.attributes = {};
    }
    /**
    Returns the index of a child among its self-reported parent's childNodes
  
    Two things could go wrong, throwing errors:
    1) The given node does not have a parentNode
    2) The node's self-reported parentNode does not think this node is one of its childNodes
    */
    Node.prototype._indexWithinParent = function () {
        var parentNode = this.parentNode;
        if (parentNode === undefined) {
            throw new Error('Orphan nodes have no index within parent.');
        }
        var index = parentNode.childNodes.indexOf(this);
        if (index === -1) {
            throw new Error('Illegitimate children have no index within parent.');
        }
        return index;
    };
    Node.prototype.getElementById = function (id) {
        return this.queryPredicate(function (node) { return node.attributes && (node.attributes['id'] == id); });
    };
    Node.prototype.getElementsByTagName = function (tagName) {
        return this.queryPredicateAll(function (node) { return node.tagName == tagName; });
    };
    Node.prototype.getElementByTagName = function (tagName) {
        return this.queryPredicate(function (node) { return node.tagName == tagName; });
    };
    Node.prototype.getElementsByClassName = function (className) {
        return this.queryPredicateAll(function (node) { return node.attributes && (node.attributes['class'] == className); });
    };
    Node.prototype.getElementByClassName = function (className) {
        return this.queryPredicate(function (node) { return node.attributes && (node.attributes['class'] == className); });
    };
    /**
    TODO: maybe use https://github.com/mdevils/node-css-selector-parser ?
    */
    Node.prototype.querySelector = function (selector) {
        throw new Error('Not yet implemented');
    };
    Node.prototype.querySelectorAll = function (selector) {
        throw new Error('Not yet implemented');
    };
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
    Node.prototype.queryPredicate = function (predicate) {
        if (predicate(this)) {
            return this;
        }
        if (this.nodeType == NodeType.ELEMENT_NODE ||
            this.nodeType == NodeType.DOCUMENT_NODE) {
            for (var i = 0, childNode; (childNode = this.childNodes[i]); i++) {
                var result = childNode.queryPredicate(predicate);
                if (result)
                    return result;
            }
        }
    };
    /**
    queryPredicateAll is like querySelectorAll, except that instead of a CSS
    selector, it takes a `predicate` function(node) => boolean, and accumulates
    and returns all of the nodes below `this` (potentially including `this`) for
    which `predicate(node)` returns true.
    */
    Node.prototype.queryPredicateAll = function (predicate) {
        var results = [];
        if (predicate(this)) {
            results.push(this);
        }
        if (this.nodeType == NodeType.ELEMENT_NODE ||
            this.nodeType == NodeType.DOCUMENT_NODE) {
            for (var i = 0, childNode; (childNode = this.childNodes[i]); i++) {
                var childResults = childNode.queryPredicateAll(predicate);
                // extend results with all of the sub-results
                Array.prototype.push.apply(results, childResults);
            }
        }
        return results;
    };
    Object.defineProperty(Node.prototype, "baseURI", {
        get: function () {
            throw new Error('Not yet implemented');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "firstChild", {
        /**
        return this node's first childNode, or null if it has no children.
        */
        get: function () {
            // node.childNodes is a POJO
            return this.childNodes[0] || null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "lastChild", {
        /**
        return this node's last childNode, or null if it has no children.
        */
        get: function () {
            return this.childNodes[this.childNodes.length - 1] || null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "localName", {
        get: function () {
            throw new Error('Not yet implemented');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "namespaceURI", {
        get: function () {
            throw new Error('Not yet implemented');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "nextSibling", {
        /** node.nextSibling returns this node's parentNode's childNode directly following this node.
      
        Throws an error if this node has no parent or if the parent does not claim this node.
      
        Returns null if this node is its parentNode's lastChild.
        */
        get: function () {
            var i = this._indexWithinParent();
            return this.parentNode[i + 1] || null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "nodeName", {
        /** node.nodeName depends on this node's type.
      
        See https://developer.mozilla.org/en-US/docs/Web/API/Node.nodeName
        */
        get: function () {
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
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "href", {
        /** node.href returns this node's [href] attribute as a URL resolved
        against the owner document's URL iff node is an anchor element.
      
        Otherwise returns null.
      
        TODO: .href should really only be defined on Element, and only tagName: 'a' elements, at that.
        */
        get: function () {
            if (this.nodeType == NodeType.ELEMENT_NODE && this.tagName.toLowerCase() == 'a') {
                var base_url = this.ownerDocument.URL || '';
                var href_attr = this.attributes['href'];
                return url_1.resolve(base_url, href_attr);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "parentElement", {
        /** node.parentElement returns this node's parentNode iff:
        1) it (node.parentNode) exists, and
        2) it (node.parentNode) is an ElementNode
      
        Otherwise returns null.
        */
        get: function () {
            var parentNode = this.parentNode;
            if (parentNode && parentNode.nodeType == NodeType.ELEMENT_NODE) {
                return parentNode;
            }
            return null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "prefix", {
        get: function () {
            throw new Error('Not yet implemented');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "previousSibling", {
        /**
        Return this node's parentNode's childNode directly before this node.
        Throws an error if this node has no parent or if the parent does not claim this node.
        Returns null if this node is its parentNode's firstChild.
        */
        get: function () {
            var i = this.parentNode._indexWithinParent();
            return this.parentNode[i - 1] || null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "textContent", {
        get: function () {
            // https://developer.mozilla.org/en-US/docs/Web/API/Node.textContent
            if (this.nodeType == NodeType.DOCUMENT_NODE ||
                this.nodeType == NodeType.DOCUMENT_TYPE_NODE ||
                this.nodeType == NodeType.NOTATION_NODE) {
                return null;
            }
            else if (this.nodeType == NodeType.CDATA_SECTION_NODE ||
                this.nodeType == NodeType.COMMENT_NODE ||
                this.nodeType == NodeType.PROCESSING_INSTRUCTION_NODE ||
                this.nodeType == NodeType.TEXT_NODE) {
                return this.nodeValue;
            }
            else {
                return this.childNodes.map(function (childNode) {
                    return childNode.textContent;
                }).join('');
            }
        },
        set: function (value) {
            this.childNodes = [new Text(value)];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "children", {
        get: function () {
            return this.childNodes.filter(function (node) {
                return node.nodeType == NodeType.ELEMENT_NODE;
            });
        },
        set: function (childNodes) {
            var self = this;
            childNodes.forEach(function (childNode) {
                childNode.parentNode = self;
            });
            this.childNodes = childNodes;
        },
        enumerable: true,
        configurable: true
    });
    /**
    toString() returns a string of XML/HTML, using XMLSerializer.default (which
    sets indent='  ' and inlineLimit=40).
    */
    Node.prototype.toString = function () {
        return XMLSerializer.default.serializeToString(this);
    };
    /**
    toJSON() returns an impoverished but still DOM-like structure
    */
    Node.prototype.toJSON = function () {
        return {
            nodeType: NodeType[this.nodeType],
            nodeValue: this.nodeValue,
        };
    };
    return Node;
})();
exports.Node = Node;
var Document = (function (_super) {
    __extends(Document, _super);
    function Document(URL, childNodes) {
        if (childNodes === void 0) { childNodes = []; }
        _super.call(this, NodeType.DOCUMENT_NODE, null);
        this.URL = URL;
        this.childNodes = childNodes;
    }
    Document.prototype.toJSON = function () {
        return {
            nodeType: NodeType[this.nodeType],
            nodeValue: this.nodeValue,
            childNodes: this.childNodes,
        };
    };
    return Document;
})(Node);
exports.Document = Document;
var Element = (function (_super) {
    __extends(Element, _super);
    function Element(tagName, attributes, ownerDocument, childNodes) {
        if (attributes === void 0) { attributes = {}; }
        if (ownerDocument === void 0) { ownerDocument = null; }
        if (childNodes === void 0) { childNodes = []; }
        _super.call(this, NodeType.ELEMENT_NODE, null);
        this.tagName = tagName;
        this.attributes = attributes;
        this.ownerDocument = ownerDocument;
        this.childNodes = childNodes;
    }
    Element.prototype.openTag = function () {
        var _this = this;
        // Create a list of space-separated attr="value" strings from each attribute
        var attrs = Object.keys(this.attributes).map(function (key) { return (key + "=\"" + _this.attributes[key] + "\""); });
        // TODO: escape quotes in attribute value
        var tagParts = [this.tagName].concat(attrs);
        return "<" + tagParts.join(' ') + ">";
    };
    Element.prototype.closeTag = function () {
        return "</" + this.tagName + ">";
    };
    Element.prototype.toJSON = function () {
        return {
            nodeType: NodeType[this.nodeType],
            nodeValue: this.nodeValue,
            tagName: this.tagName,
            attributes: this.attributes,
            childNodes: this.childNodes,
        };
    };
    return Element;
})(Node);
exports.Element = Element;
// CharacterData is an abstract class
var CharacterData = (function (_super) {
    __extends(CharacterData, _super);
    function CharacterData() {
        _super.apply(this, arguments);
    }
    return CharacterData;
})(Node);
exports.CharacterData = CharacterData;
var Text = (function (_super) {
    __extends(Text, _super);
    function Text(nodeValue) {
        _super.call(this, NodeType.TEXT_NODE, nodeValue);
    }
    Text.prototype.toString = function () {
        return this.nodeValue;
    };
    return Text;
})(CharacterData);
exports.Text = Text;
var Comment = (function (_super) {
    __extends(Comment, _super);
    function Comment(nodeValue) {
        _super.call(this, NodeType.COMMENT_NODE, nodeValue);
    }
    Comment.prototype.toString = function () {
        return "<!--" + this.nodeValue + "-->";
    };
    return Comment;
})(CharacterData);
exports.Comment = Comment;
var ProcessingInstruction = (function (_super) {
    __extends(ProcessingInstruction, _super);
    function ProcessingInstruction(nodeValue) {
        _super.call(this, NodeType.PROCESSING_INSTRUCTION_NODE, nodeValue);
    }
    ProcessingInstruction.prototype.toString = function () {
        return "<" + this.nodeValue + ">";
    };
    return ProcessingInstruction;
})(CharacterData);
exports.ProcessingInstruction = ProcessingInstruction;
var CDATASection = (function (_super) {
    __extends(CDATASection, _super);
    function CDATASection(nodeValue) {
        _super.call(this, NodeType.CDATA_SECTION_NODE, nodeValue);
    }
    CDATASection.prototype.toString = function () {
        return "<![CDATA[" + this.nodeValue + "]]>";
    };
    return CDATASection;
})(CharacterData);
exports.CDATASection = CDATASection;
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
var Handler = (function (_super) {
    __extends(Handler, _super);
    function Handler(URL) {
        if (URL === void 0) { URL = '/'; }
        _super.call(this);
        // initialize with a single special document node on the stack
        this.document = new Document(URL);
        this._stack = [this.document];
    }
    Object.defineProperty(Handler.prototype, "_stackTop", {
        get: function () {
            return this._stack[this._stack.length - 1];
        },
        enumerable: true,
        configurable: true
    });
    Handler.prototype.onreset = function () {
        throw new Error('domlike.Handler:onreset is not supported');
    };
    Handler.prototype.onend = function () {
        // throw new Error('domlike.Handler:onend is not supported');
        if (this._stack.length > 1) {
            throw new Error('domlike.Handler:end reached with unfinished nodes on the stack');
        }
        // this.callback(this.document); // == this._stack[0]
        this.emit('end', this.document);
    };
    Handler.prototype.onerror = function (error) {
        throw new Error("domlike.Handler:onerror: " + error);
    };
    Handler.prototype.onopentag = function (name, attribs) {
        var element = new Element(name, attribs, this.document);
        this._stack.push(element);
    };
    Handler.prototype.onclosetag = function (name) {
        // console.error(`>> closetag ${name}`);
        var node = this._stack.pop();
        if (name !== node.tagName) {
            throw new Error("tagName of closed tag, \"" + name + "\", does not match tagName of top tag on stack, \"" + node.tagName + "\"");
        }
        node.parentNode = this._stackTop;
        this._stackTop.childNodes.push(node);
    };
    Handler.prototype.onattribute = function (name, value) {
        // no-op
    };
    Handler.prototype.ontext = function (text) {
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
    };
    Handler.prototype.oncomment = function (data) {
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
    };
    Handler.prototype.oncommentend = function () {
        // no-op
    };
    Handler.prototype.oncdatastart = function () {
        // console.error(`cdatastart`);
        var cdata = new CDATASection('');
        this._stack.push(cdata);
    };
    Handler.prototype.oncdataend = function () {
        // console.error(`cdataend`);
        throw new Error('Not yet implemented');
        // this._flush();
    };
    /** Processing instructions are emitted as a single event, so they never get
    put on the stack; instead, they get added directly to the current top node,
    which should only ever be a DocumentNode, but we don't enforce that.
    */
    Handler.prototype.onprocessinginstruction = function (name, data) {
        // console.error(`processinginstruction ${name} ${data}`);
        var processing_instruction = new ProcessingInstruction(data);
        processing_instruction.parentNode = this._stackTop;
        this._stackTop.childNodes.push(processing_instruction);
    };
    return Handler;
})(events.EventEmitter);
exports.Handler = Handler;
var XMLSerializer = (function () {
    function XMLSerializer(indentation, inlineLimit) {
        this.indentation = indentation;
        this.inlineLimit = inlineLimit;
    }
    /**
    Return an Array of strings for a given Node.
    */
    XMLSerializer.prototype._serializeToLines = function (node) {
        var _this = this;
        if (node instanceof Document) {
            return flatMap(node.childNodes, function (node) { return _this._serializeToLines(node); }).filter(function (str) { return str.length > 0; });
        }
        else if (node instanceof Element) {
            var childLines = flatMap(node.childNodes, function (node) { return _this._serializeToLines(node); }).filter(function (str) { return str.length > 0; });
            // if the child is multiple lines already, or one line that's longer than `inlineLimit`, we indent over multiple lines
            var inline = (childLines.length <= 1) && (sum(childLines, function (str) { return str.length; }) < this.inlineLimit);
            // arrange the children
            childLines = inline ? [childLines.join('')] : childLines.map(function (line) { return _this.indentation + line; });
            childLines.unshift(node.openTag());
            childLines.push(node.closeTag());
            // join them if inline
            return inline ? [childLines.join('')] : childLines;
        }
        // all the other node types handle toString() just fine
        return [node.toString().trim()];
    };
    XMLSerializer.prototype.serializeToString = function (node) {
        return this._serializeToLines(node).join('\n');
    };
    XMLSerializer.default = new XMLSerializer('  ', 40);
    return XMLSerializer;
})();
exports.XMLSerializer = XMLSerializer;
var Parser = (function (_super) {
    __extends(Parser, _super);
    function Parser(opts) {
        var _this = this;
        if (opts === void 0) { opts = { decodeEntities: true }; }
        _super.call(this, opts);
        this.handler = new Handler();
        this.parser = new htmlparser2.Parser(this.handler, opts);
        this.on('finish', function () {
            _this.emit('document', _this.document);
        });
    }
    Object.defineProperty(Parser.prototype, "document", {
        get: function () {
            return this.handler.document;
        },
        enumerable: true,
        configurable: true
    });
    Parser.prototype._write = function (chunk, encoding, callback) {
        this.parser.write(chunk.toString());
        callback();
    };
    return Parser;
})(stream.Writable);
exports.Parser = Parser;
//// }
