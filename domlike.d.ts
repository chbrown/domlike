/// <reference path="../../type_declarations/index.d.ts" />
import * as stream from 'stream';
import * as htmlparser2 from 'htmlparser2';
import * as events from 'events';
declare module "domlike" {
    enum NodeType {
        ELEMENT_NODE = 1,
        ATTRIBUTE_NODE = 2,
        TEXT_NODE = 3,
        CDATA_SECTION_NODE = 4,
        ENTITY_REFERENCE_NODE = 5,
        ENTITY_NODE = 6,
        PROCESSING_INSTRUCTION_NODE = 7,
        COMMENT_NODE = 8,
        DOCUMENT_NODE = 9,
        DOCUMENT_TYPE_NODE = 10,
        DOCUMENT_FRAGMENT_NODE = 11,
        NOTATION_NODE = 12,
    }
    /**
    For the document itself, `nodeValue` returns null.
    For text, comment, and CDATA nodes, `nodeValue` returns the content of the node.
    For attribute nodes, `nodeValue` returns the value of the attribute.
    */
    class Node {
        nodeType: NodeType;
        nodeValue: any;
        parentNode: Node;
        tagName: string;
        name: string;
        target: string;
        attributes: {
            [index: string]: string;
        };
        childNodes: Node[];
        ownerDocument: Document;
        constructor(nodeType: NodeType, nodeValue: any);
        /**
        Returns the index of a child among its self-reported parent's childNodes
      
        Two things could go wrong, throwing errors:
        1) The given node does not have a parentNode
        2) The node's self-reported parentNode does not think this node is one of its childNodes
        */
        private _indexWithinParent();
        getElementById(id: string): Node;
        getElementsByTagName(tagName: string): Node[];
        getElementByTagName(tagName: string): Node;
        getElementsByClassName(className: string): Node[];
        getElementByClassName(className: string): Node;
        /**
        TODO: maybe use https://github.com/mdevils/node-css-selector-parser ?
        */
        querySelector(selector: string): Node;
        querySelectorAll(selector: string): Node[];
        /**
        queryPredicateAll is like querySelectorAll, except that instead of a CSS
        selector, it takes a `predicate` function(node) => boolean, and returns the
        first node below `this` (potentially `this`) for which `predicate(node)`
        returns true. Return undefined if no node matches.
      
        This takes a depth-first-search strategy:
      
        1. try on the current node
        2. recurse on the current node's children
        */
        queryPredicate(predicate: (node: Node) => boolean): Node;
        /**
        queryPredicateAll is like querySelectorAll, except that instead of a CSS
        selector, it takes a `predicate` function(node) => boolean, and accumulates
        and returns all of the nodes below `this` (potentially including `this`) for
        which `predicate(node)` returns true.
        */
        queryPredicateAll(predicate: (node: Node) => boolean): Node[];
        baseURI: void;
        /**
        return this node's first childNode, or null if it has no children.
        */
        firstChild: Node;
        /**
        return this node's last childNode, or null if it has no children.
        */
        lastChild: Node;
        localName: void;
        namespaceURI: void;
        /** node.nextSibling returns this node's parentNode's childNode directly following this node.
      
        Throws an error if this node has no parent or if the parent does not claim this node.
      
        Returns null if this node is its parentNode's lastChild.
        */
        nextSibling: any;
        /** node.nodeName depends on this node's type.
      
        See https://developer.mozilla.org/en-US/docs/Web/API/Node.nodeName
        */
        nodeName: string;
        /** node.href returns this node's [href] attribute as a URL resolved
        against the owner document's URL iff node is an anchor element.
      
        Otherwise returns null.
      
        TODO: .href should really only be defined on Element, and only tagName: 'a' elements, at that.
        */
        href: string;
        /** node.parentElement returns this node's parentNode iff:
        1) it (node.parentNode) exists, and
        2) it (node.parentNode) is an ElementNode
      
        Otherwise returns null.
        */
        parentElement: Node;
        prefix: void;
        /**
        Return this node's parentNode's childNode directly before this node.
        Throws an error if this node has no parent or if the parent does not claim this node.
        Returns null if this node is its parentNode's firstChild.
        */
        previousSibling: any;
        textContent: any;
        children: Node[];
        /**
        All Node subclasses in use should override this method
        */
        toString(): string;
        toJSON(): {
            nodeType: string;
            nodeValue: any;
        };
    }
    class Document extends Node {
        URL: string;
        childNodes: any[];
        constructor(URL: string, childNodes?: any[]);
        toString(): string;
        toJSON(): {
            nodeType: string;
            nodeValue: any;
            childNodes: any[];
        };
    }
    class Element extends Node {
        tagName: string;
        attributes: {
            [index: string]: string;
        };
        ownerDocument: any;
        childNodes: any[];
        constructor(tagName: string, attributes?: {
            [index: string]: string;
        }, ownerDocument?: any, childNodes?: any[]);
        openTag(): string;
        closeTag(): string;
        toString(): string;
        toJSON(): {
            nodeType: string;
            nodeValue: any;
            tagName: string;
            attributes: {
                [index: string]: string;
            };
            childNodes: any[];
        };
    }
    class CharacterData extends Node {
    }
    class Text extends CharacterData {
        constructor(nodeValue: string);
        toString(): string;
    }
    class Comment extends CharacterData {
        constructor(nodeValue: string);
        toString(): string;
    }
    class ProcessingInstruction extends CharacterData {
        constructor(nodeValue: string);
        toString(): string;
    }
    class CDATASection extends CharacterData {
        constructor(nodeValue: string);
        toString(): string;
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
    class Handler extends events.EventEmitter implements htmlparser2.Handler {
        private _stack;
        document: Document;
        constructor(URL?: string);
        private _stackTop;
        onreset(): void;
        onend(): void;
        onerror(error: Error): void;
        onopentag(name: string, attribs: {
            [index: string]: string;
        }): void;
        onclosetag(name: string): void;
        onattribute(name: string, value: string): void;
        ontext(text: string): void;
        oncomment(data: string): void;
        oncommentend(): void;
        oncdatastart(): void;
        oncdataend(): void;
        /** Processing instructions are emitted as a single event, so they never get
        put on the stack; instead, they get added directly to the current top node,
        which should only ever be a DocumentNode, but we don't enforce that.
        */
        onprocessinginstruction(name: string, data: string): void;
    }
    /**
    Return an Array of strings for a given Node.
    
    */
    function serializeNode(node: Node | Document | Element, indentation?: string, inlineLimit?: number): string[];
    class Parser extends stream.Writable {
        handler: Handler;
        parser: htmlparser2.Parser;
        constructor(opts?: stream.WritableOptions);
        document: Document;
        _write(chunk: Buffer | string, encoding: string, callback: (error?: Error) => void): void;
    }
}
