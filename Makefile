
test:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter spec

build:
     node build.js
        
.PHONY: test