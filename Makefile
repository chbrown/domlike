BIN := node_modules/.bin
TYPESCRIPT := index.ts
JAVASCRIPT := $(TYPESCRIPT:%.ts=%.js)

all: $(JAVASCRIPT)

$(BIN)/tsc $(BIN)/mocha:
	npm install

%.js: %.ts $(BIN)/tsc
	$(BIN)/tsc -d

test: $(JAVASCRIPT) $(BIN)/mocha
	$(BIN)/mocha --compilers js:babel-core/register tests/
