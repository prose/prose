# See the README for installation instructions.

all: prose.js prose.min.js

clean:
	rm -f prose*.js && rm -f templates/templates.js

TEMPLATES = $(shell find templates -type f -name '*.html')
templates/templates.js: $(TEMPLATES)
	node build.js

LIBS = \
	js/lib/codemirror/codemirror.js \
	js/lib/codemirror/htmlmixed.js \
	js/lib/codemirror/clike.js \
	js/lib/codemirror/yaml.js \
	js/lib/codemirror/ruby.js \
	js/lib/codemirror/markdown.js \
	js/lib/codemirror/xml.js \
	js/lib/codemirror/javascript.js \
	js/lib/codemirror/css.js \
	js/lib/codemirror/gfm.js \
	js/lib/diff-match-patch.js \
	js/lib/liquid.js \
	js/lib/liquid.patch.js \
	js/lib/github.js

APPLICATION = \
	js/prose/views/notification.js \
	js/prose/views/preview.js \
	js/prose/views/post.js \
	js/prose/views/posts.js \
	js/prose/views/profile.js \
	js/prose/views/start.js \
	js/prose/views/application.js \
	js/prose/views/app.js \
	js/prose/routers/application.js \
	js/prose/util.js \
	js/prose/boot.js \
	templates/templates.js \
	js/prose/model.js \
	js/prose/cookie.js

prose.js: $(APPLICATION)
	cat $(LIBS) > prose.js
	browserify $(APPLICATION) -d >> prose.js

prose.min.js: $(APPLICATION)
	cat $(LIBS) > prose.min.js
	browserify $(APPLICATION) | uglifyjs >> prose.min.js
