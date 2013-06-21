# See the README for installation instructions.
UGLIFY = node_modules/.bin/uglifyjs
BROWSERIFY = node_modules/.bin/browserify
TEMPLATES = $(shell find templates -type f -name '*.html')

all: \
	$(shell npm install && mkdir -p dist) \
	dist/prose.js \
	dist/prose.min.js

clean:
	rm -f dist/*

translations:
	node translations/update_locales
	node build

dist/templates.js: $(TEMPLATES)
	node build

oauth.json:
	test -s oauth.json || curl 'https://raw.github.com/prose/prose/gh-pages/oauth.json' > oauth.json

LIBS = \
	src/libs/codemirror/codemirror.js \
	src/libs/codemirror/overlay.js \
	src/libs/codemirror/htmlmixed.js \
	src/libs/codemirror/clike.js \
	src/libs/codemirror/yaml.js \
	src/libs/codemirror/ruby.js \
	src/libs/codemirror/markdown.js \
	src/libs/codemirror/xml.js \
	src/libs/codemirror/javascript.js \
	src/libs/codemirror/css.js \
	src/libs/codemirror/gfm.js \
	src/libs/liquid.js \
	src/libs/liquid.patch.js

APPLICATION = \
	src/prose/views/notification.js \
	src/prose/views/documentation.js \
	src/prose/views/post.js \
	src/prose/views/posts.js \
	src/prose/views/profile.js \
	src/prose/views/preview.js \
	src/prose/views/start.js \
	src/prose/views/app.js \
	src/prose/router.js \
	src/prose/util.js \
	src/prose/boot.js \
	dist/templates.js \
	src/prose/models.js \
	src/prose/cookie.js \
	src/prose/upload.js \
	src/prose/toolbar/markdown.js \
	src/libs/github.js \
	translations/locales.js \
	locale.js

dist/prose.js: oauth.json $(APPLICATION) $(LIBS) dist/templates.js
	cat $(LIBS) > dist/prose.js
	$(BROWSERIFY) src/prose/boot.js >> dist/prose.js

dist/prose.min.js: dist/prose.js
	$(UGLIFY) dist/prose.js > dist/prose.min.js

.PHONY: clean translations
