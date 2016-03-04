BIN := node_modules/.bin
TYPESCRIPT := $(shell jq -r '.files[]' tsconfig.json | grep -Fv .d.ts)

all: $(TYPESCRIPT:%.ts=%.js) .npmignore .gitignore

all: $(JAVASCRIPT)

$(BIN)/tsc $(BIN)/mocha:
	npm install

.npmignore: tsconfig.json
	echo $(TYPESCRIPT) .travis.yml Makefile tsconfig.json tests/ | tr ' ' '\n' > $@

.gitignore: tsconfig.json
	echo $(TYPESCRIPT:%.ts=%.js) $(TYPESCRIPT:%.ts=%.d.ts) | tr ' ' '\n' > $@

%.js %.d.ts: %.ts $(BIN)/tsc
	$(BIN)/tsc -d

test: $(TYPESCRIPT:%.ts=%.js) $(BIN)/mocha
	$(BIN)/mocha --compilers js:babel-core/register tests/
