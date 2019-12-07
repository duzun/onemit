
test:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter spec

build:
	npm run build.min

.PHONY: test
