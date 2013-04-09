# See the README for installation instructions.

all: prose.min.js

clean:
	rm -f prose*.js

APPLICATION = \
	js/lib/github.js \
	js/lib/jquery.cookie.js \
	js/lib/liquid.js \
	js/lib/liquid.patch.js \
	js/lib/diff-match-patch.js \
	js/lib/codemirror/codemirror.js \
	js/lib/codemirror/gfm.js \
	js/lib/codemirror/css.js \
	js/lib/codemirror/javascript.js \
	js/lib/codemirror/xml.js \
	js/lib/codemirror/markdown.js \
	js/lib/codemirror/htmlmixed.js \
	js/lib/codemirror/ruby.js \
	js/lib/codemirror/yaml.js \
	js/lib/codemirror/clike.js \
	js/prose/boot.js \
	js/prose/util.js \
	js/prose/model.js \
	js/prose/routers/application.js \
	js/prose/views/app.js \
	js/prose/views/application.js \
	js/prose/views/notification.js \
	js/prose/views/profile.js \
	js/prose/views/start.js \
	js/prose/views/posts.js \
	js/prose/views/post.js \
	js/prose/init.js
	
prose.js: $(APPLICATION)
	browserify \
		-r backbone \
		-r underscore \
		-r jquery-browserify \
		-r chosen-jquery-browserify \
		-r chrono \
		-r keymaster \
		-r marked \
		-r queue-async \
		-r js-yaml \
		-r js-base64 > prose.js
	cat $(APPLICATION) >> prose.js

prose.min.js: prose.js
	uglifyjs prose.js -c -m > prose.min.js

