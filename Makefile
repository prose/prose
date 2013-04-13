# See the README for installation instructions.

all: prose.js prose.min.js

clean:
	rm -f prose*.js && rm -f templates.js

TEMPLATES = $(shell find templates -type f -name '*.html')
templates.js: $(TEMPLATES)
	node build.js

LIBS = \
	src/libs/codemirror/codemirror.js \
	src/libs/codemirror/htmlmixed.js \
	src/libs/codemirror/clike.js \
	src/libs/codemirror/yaml.js \
	src/libs/codemirror/ruby.js \
	src/libs/codemirror/markdown.js \
	src/libs/codemirror/xml.js \
	src/libs/codemirror/javascript.js \
	src/libs/codemirror/css.js \
	src/libs/codemirror/gfm.js \
	src/libs/diff-match-patch.js \
	src/libs/liquid.js \
	src/libs/liquid.patch.js \
	src/libs/github.js

APPLICATION = \
	src/prose/views/notification.js \
	src/prose/views/preview.js \
	src/prose/views/post.js \
	src/prose/views/posts.js \
	src/prose/views/profile.js \
	src/prose/views/start.js \
	src/prose/views/application.js \
	src/prose/views/app.js \
	src/prose/routers/application.js \
	src/prose/util.js \
	src/prose/boot.js \
	templates.js \
	src/prose/model.js \
	src/prose/cookie.js

prose.js: $(APPLICATION)
	cat $(LIBS) > prose.js
	browserify $(APPLICATION) -d >> prose.js

prose.min.js: $(APPLICATION)
	cat $(LIBS) > prose.min.js
	browserify $(APPLICATION) | uglifyjs >> prose.min.js
