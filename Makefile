BIN := node_modules/.bin
TYPESCRIPT := $(shell jq -r '.files[]' tsconfig.json | grep -Fv .d.ts)
JAVASCRIPT := $(TYPESCRIPT:%.ts=%.js)

all: $(JAVASCRIPT)

$(BIN)/tsc $(BIN)/mocha:
	npm install

%.js: %.ts $(BIN)/tsc
	$(BIN)/tsc -d

test: $(JAVASCRIPT) $(BIN)/mocha
	$(BIN)/mocha --compilers js:babel-core/register tests/
