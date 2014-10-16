/*jslint node: true */
var logger = require('loge');
var nodeTypes = require('./types');

// #############
// Local helpers
// #############

function indexOfChildNode(node) {
  /** Returns the index of a child among its self-reported parent's childNodes

  Two things could go wrong, throwing errors:
  1) The given node does not have a parentNode
  2) The node's self-reported parentNode does not think this node is one of its childNodes

  */
  var parentNode = node.parentNode;
  if (parentNode === undefined) {
    throw new Error('Orphan nodes have no index.');
  }
  var index = parentNode.childNodes.indexOf(node);
  if (index === -1) {
    throw new Error('Illegitimate children have no index.');
  }
  return index;
}

function notYetImplemented() {
  /** Always throws an Error with the message: "Not yet implemented".
  */
  throw new Error('Not yet implemented');
}

function serializeAttributes(attributes) {
  /**
  Returns String
  */
  var keyvals = [];
  for (var key in attributes) {
    keyvals.push(key + '="' + attributes[key] + '"');
  }
  return keyvals.join(' ');
}

// ###########
// Constructor
// ###########

var Node = module.exports = function(nodeType, nodeValue) {
  this.nodeType = nodeType;
  // For the document itself, nodeValue returns null.
  // For text, comment, and CDATA nodes, nodeValue returns the content of the node.
  // For attribute nodes, the value of the attribute is returned.
  this.nodeValue = nodeValue || null;
};

// #######
// Methods
// #######

Node.prototype.getElementById = function(id) {
  return this.firstDFS(function(node) {
    return node.attributes ? node.attributes.id == id : false;
  });
};
Node.prototype.getElementsByTagName = function(tagName) {
  return this.allDFS(function(node) {
    return node.tagName == tagName;
  });
};
Node.prototype.querySelector = function(selector) {
  return this.firstDFS(function(node) {
    // maybe use https://github.com/mdevils/node-css-selector-parser ?
    throw new Error('Not yet implemented');
  });
};

// ####################
// Non-standard methods
// ####################

Node.prototype.firstDFS = function(predicate) {
  /** Depth-first search strategy:

    1. try on the current node
    2. recurse on the current node's children

    return as soon as anything looks good. return null if nothing does.
  */
  if (predicate(this)) {
    return this;
  }

  if (this.nodeType == nodeTypes.ELEMENT_NODE ||
      this.nodeType == nodeTypes.DOCUMENT_NODE) {
    for (var i = 0, childNode; (childNode = this.childNodes[i]); i++) {
      var result = childNode.firstDFS(predicate);
      if (result) return result;
    }
  }
};

Node.prototype.allDFS = function(predicate) {
  var results = [];
  if (predicate(this)) {
    results.push(this);
  }

  if (this.nodeType == nodeTypes.ELEMENT_NODE ||
      this.nodeType == nodeTypes.DOCUMENT_NODE) {
    for (var i = 0, childNode; (childNode = this.childNodes[i]); i++) {
      var subresults = childNode.allDFS(predicate);
      // extend results with all of subresults
      Array.prototype.push.apply(results, subresults);
    }
  }

  return results;
};

Node.prototype.inspect = function(depth) {
  var copy = {};
  for (var key in this) {
    if (this.hasOwnProperty(key)) {
      copy[key] = this[key];
    }
  }
  if (copy.parentNode) copy.parentNode = '<ref>';
  return copy;
};

// Node.prototype.getElementByTagName = function(tagName) {
//   return this.firstDFS(function(node) {
//     return node.tagName == tagName;
//   });
// };

// Node.prototype.matches = function(selector) {};

// function serializeNodes(nodes) {
//   var parts = nodes.map(function(node) {
//     return node.toHTML();
//   });
//   return parts.join('');
// }

Node.prototype.toHTML = function() {
  if (this.nodeType == nodeTypes.ELEMENT_NODE) {
    var attributes_string = serializeAttributes(this.attributes);
    var start_tag = '<' + this.tagName + (attributes_string.length ? ' ' + attributes_string : '') + '>';
    var end_tag = '</' + this.tagName + '>';

    var innerHTML = this.childNodes.map(function(node) {
      return node.toHTML();
    }).join('');

    return start_tag + innerHTML + end_tag;
  }
  // ATTRIBUTE_NODE should not come up
  else if (this.nodeType == nodeTypes.TEXT_NODE) {
    return this.nodeValue;
  }
  else if (this.nodeType == nodeTypes.CDATA_SECTION_NODE) {
    return '<![CDATA[' + this.nodeValue + ']]>';
  }
  // ENTITY_REFERENCE_NODE should not come up
  // ENTITY_NODE should not come up
  else if (this.nodeType == nodeTypes.PROCESSING_INSTRUCTION_NODE) {
    return '<' + this.nodeValue + '>';
  }
  else if (this.nodeType == nodeTypes.COMMENT_NODE) {
    return '<!--' + this.nodeValue + '-->';
  }
  else if (this.nodeType == nodeTypes.DOCUMENT_NODE) {
    return this.childNodes.map(function(node) {
      return node.toHTML();
    }).join('');
  }
  // DOCUMENT_TYPE_NODE should not come up
  // DOCUMENT_FRAGMENT_NODE should not come up
  // NOTATION_NODE should not come up
  else {
    throw new Error('Cannot serialize node to HTML');
  }
};

// ##########
// Properties
// ##########

Object.defineProperty(Node.prototype, 'baseURI', {get: notYetImplemented});

// node.childNodes is a POJO

Object.defineProperty(Node.prototype, 'firstChild', {
  get: function() {
    /** node.firstChild returns this node's first childNode, or null if it has no children.
    */
    return this.childNodes[0] || null;
  }
});

Object.defineProperty(Node.prototype, 'lastChild', {
  get: function() {
    /** node.firstChild returns this node's last childNode, or null if it has no children.
    */
    return this.childNodes[this.childNodes.length - 1] || null;
  }
});

Object.defineProperty(Node.prototype, 'localName', {get: notYetImplemented});

Object.defineProperty(Node.prototype, 'namespaceURI', {get: notYetImplemented});

Object.defineProperty(Node.prototype, 'nextSibling', {
  get: function() {
    /** node.nextSibling returns this node's parentNode's childNode directly following this node.

    Throws an error if this node has no parent or if the parent does not claim this node.

    Returns null if this node is its parentNode's lastChild.
    */
    var i = indexOfChildNode(this);
    return this.parentNode[i + 1] || null;
  }
});

Object.defineProperty(Node.prototype, 'nodeName', {
  get: function() {
    /** node.nodeName depends on this node's type.

    See https://developer.mozilla.org/en-US/docs/Web/API/Node.nodeName
    */
    if (this.nodeType == nodeTypes.ELEMENT_NODE) {
      return this.tagName;
    }
    else if (this.nodeType == nodeTypes.ATTRIBUTE_NODE) {
      return this.name;
    }
    else if (this.nodeType == nodeTypes.TEXT_NODE) {
      return '#text';
    }
    else if (this.nodeType == nodeTypes.CDATA_SECTION_NODE) {
      return '#cdata-section';
    }
    else if (this.nodeType == nodeTypes.ENTITY_REFERENCE_NODE) {
      return new Error('EntityReferenceNode.nodeName is not yet implemented');
    }
    else if (this.nodeType == nodeTypes.ENTITY_NODE) {
      return new Error('EntityNode.nodeName is not yet implemented');
    }
    else if (this.nodeType == nodeTypes.PROCESSING_INSTRUCTION_NODE) {
      return this.target;
    }
    else if (this.nodeType == nodeTypes.COMMENT_NODE) {
      return '#comment';
    }
    else if (this.nodeType == nodeTypes.DOCUMENT_NODE) {
      return '#document';
    }
    else if (this.nodeType == nodeTypes.DOCUMENT_TYPE_NODE) {
      return this.name;
    }
    else if (this.nodeType == nodeTypes.DOCUMENT_FRAGMENT_NODE) {
      return '#document-fragment';
    }
    else if (this.nodeType == nodeTypes.NOTATION_NODE) {
      throw new Error('NotationNode.nodeName is not yet implemented');
    }
    else {
      throw new Error('Node with unrecognized nodeType has no nodeName');
    }
  }
});

// node.nodeType is a POJO

// node.nodeValue is a POJO

Object.defineProperty(Node.prototype, 'ownerDocument', {get: notYetImplemented});

Object.defineProperty(Node.prototype, 'parentElement', {
  get: function() {
    /** node.parentElement returns this node's parentNode iff:
    1) it (node.parentNode) exists, and
    2) it (node.parentNode) is an ElementNode

    Otherwise returns null.
    */
    var parentNode = this.parentNode;
    if (parentNode && parentNode.nodeType == nodeTypes.ELEMENT_NODE) {
      return parentNode;
    }
    return null;
  }
});

// node.parentNode is a POJO

Object.defineProperty(Node.prototype, 'prefix', {get: notYetImplemented});

Object.defineProperty(Node.prototype, 'previousSibling', {
  get: function() {
    /** node.previousSibling returns this node's parentNode's childNode directly before this node.

    Throws an error if this node has no parent or if the parent does not claim this node.

    Returns null if this node is its parentNode's firstChild.
    */
    var i = indexOfChildNode(this);
    return this.parentNode[i - 1] || null;
  }
});

Object.defineProperty(Node.prototype, 'textContent', {
  // https://developer.mozilla.org/en-US/docs/Web/API/Node.textContent
  get: function() {
    if (this.nodeType == nodeTypes.DOCUMENT_NODE ||
        this.nodeType == nodeTypes.DOCUMENT_TYPE_NODE ||
        this.nodeType == nodeTypes.NOTATION_NODE) {
      return null;
    }
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.nodeValue
    else if (this.nodeType == nodeTypes.CDATA_SECTION_NODE ||
        this.nodeType == nodeTypes.COMMENT_NODE ||
        this.nodeType == nodeTypes.PROCESSING_INSTRUCTION_NODE ||
        this.nodeType == nodeTypes.TEXT_NODE) {
      return this.nodeValue;
    }
    else {
      return this.childNodes.map(function(childNode) {
        return childNode.textContent;
      }).join('');
    }
  },
  set: function(value) {
    this.childNodes = [new Node(nodeTypes.TEXT_NODE, value)];
  }
});

// ##################
// Element properties
// ##################

Object.defineProperty(Node.prototype, 'children', {
  get: function() {
    return this.childNodes.filter(function(node) {
      return node.nodeType == nodeTypes.ELEMENT_NODE;
    });
  },
  set: function(childNodes) {
    var self = this;
    childNodes.forEach(function(childNode) {
      childNode.parentNode = self;
    });
    this.childNodes = childNodes;
  }
});
