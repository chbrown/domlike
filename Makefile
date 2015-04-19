DT := form-data/form-data htmlparser2/htmlparser2 mocha/mocha node/node request/request

.PHONY: all test

all: domlike.d.ts index.js type_declarations

type_declarations: $(DT:%=type_declarations/DefinitelyTyped/%.d.ts)

node_modules/.bin/tsc node_modules/.bin/mocha:
	npm install

%.js: %.ts | node_modules/.bin/tsc type_declarations
	node_modules/.bin/tsc --module commonjs --target ES5 $<

type_declarations/DefinitelyTyped/%:
	mkdir -p $(@D)
	curl -s https://raw.githubusercontent.com/borisyankov/DefinitelyTyped/master/$* > $@

domlike.d.ts: index.ts
	# remove the quadruple-slash meta-comment
	sed 's:^//// ::g' $< > module.ts
	node_modules/.bin/tsc --module commonjs --target ES5 --declaration module.ts
	# change the module name to a string,
	# and relativize the reference[path] import value to where it would be relative to the node_modules subdirectory
	cat module.d.ts | \
		sed 's:export declare module domlike:declare module "domlike":' | \
		sed 's:type_declarations:../../type_declarations:' > $@
	# cleanup
	rm module.{ts,d.ts,js}

test: index.js | node_modules/.bin/mocha
	node_modules/.bin/mocha test
