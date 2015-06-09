BIN := node_modules/.bin
DTS := form-data/form-data htmlparser2/htmlparser2 mocha/mocha node/node request/request

.PHONY: all test
all: domlike.d.ts index.js
type_declarations: $(DTS:%=type_declarations/DefinitelyTyped/%.d.ts)

$(BIN)/tsc $(BIN)/mocha:
	npm install

%.js: %.ts $(BIN)/tsc type_declarations
	$(BIN)/tsc --module commonjs --target ES5 $<

type_declarations/DefinitelyTyped/%:
	mkdir -p $(@D)
	curl -s https://raw.githubusercontent.com/chbrown/DefinitelyTyped/master/$* > $@

domlike.d.ts: index.ts index.js
	# remove the quadruple-slash meta-comment
	sed 's:^//// ::g' $< > module.ts
	$(BIN)/tsc --module commonjs --target ES5 --declaration module.ts
	# change the module name to a string,
	# and relativize the reference[path] import value to where it would be relative to the node_modules subdirectory
	cat module.d.ts | \
		sed 's:export declare module domlike:declare module "domlike":' | \
		sed 's:type_declarations:../../type_declarations:' > $@
	# cleanup
	rm module.{ts,d.ts,js}

test: index.js | $(BIN)/mocha
	$(BIN)/mocha test
