# See the README for installation instructions.
UGLIFY = node_modules/.bin/uglifyjs
BROWSERIFY = node_modules/.bin/browserify
TEMPLATES = $(shell find templates -type f -name '*.html')

all: \
	dist/prose.js \
	dist/prose.min.js

install:
	npm install && mkdir -p dist && make

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
	vendor/codemirror/codemirror.js \
	vendor/codemirror/overlay.js \
	vendor/codemirror/htmlmixed.js \
	vendor/codemirror/clike.js \
	vendor/codemirror/yaml.js \
	vendor/codemirror/ruby.js \
	vendor/codemirror/markdown.js \
	vendor/codemirror/xml.js \
	vendor/codemirror/javascript.js \
	vendor/codemirror/css.js \
	vendor/codemirror/gfm.js \
	vendor/liquid.js

APPLICATION = \
	app/collections/branches.js \
	app/collections/commits.js \
	app/collections/files.js \
	app/collections/orgs.js \
	app/collections/repos.js \
	app/collections/users.js \
	app/models/branch.js \
	app/models/commit.js \
	app/models/file.js \
	app/models/folder.js \
	app/models/org.js \
	app/models/repo.js \
	app/models/user.js \
	app/views/app.js \
	app/views/documentation.js \
	app/views/chooselanguage.js \
	app/views/file.js \
	app/views/files.js \
	app/views/header.js \
	app/views/toolbar.js \
	app/views/metadata.js \
	app/views/nav.js \
	app/views/notification.js \
	app/views/profile.js \
	app/views/repo.js \
	app/views/repos.js \
	app/views/search.js \
	app/views/start.js \
	app/views/li/file.js \
	app/views/li/folder.js \
	app/views/li/repo.js \
	app/views/sidebar.js \
	app/views/sidebar/branch.js \
	app/views/sidebar/branches.js \
	app/views/sidebar/drafts.js \
	app/views/sidebar/li/commit.js \
	app/views/sidebar/orgs.js \
	app/views/sidebar/history.js \
	app/views/sidebar/save.js \
	app/views/sidebar/settings.js \
	app/router.js \
	app/util.js \
	app/boot.js \
	app/status.js \
	dist/templates.js \
	app/cookie.js \
	app/upload.js \
	app/toolbar/markdown.js \
	locale.js \
	translations/locales.js \
	vendor/liquid.patch.js

dist/prose.js: oauth.json $(APPLICATION) $(LIBS) dist/templates.js
	cat $(LIBS) > dist/prose.js
	$(BROWSERIFY) app/boot.js >> dist/prose.js

dist/prose.min.js: dist/prose.js
	$(UGLIFY) dist/prose.js > dist/prose.min.js

.PHONY: clean translations install
