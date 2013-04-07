# See the README for installation instructions.

node_modules:
	npm install

all: js/bundle.min.js

prose.js: \ 
	js/lib/github.js \
	js/lib/jquery.cookie.js \
	js/lib/liquid.min.js \
	js/lib/liquid.patch.js \
	js/lib/diff-match.patch.js \
	js/lib/codemirror/codemirror.js \
	js/lib/codemirror/css.js \
	js/lib/codemirror/htmlmixed.js \
	js/lib/codemirror/javascript.js \
	js/lib/codemirror/markdown.js \
	js/lib/codemirror/yaml.js \
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
	js/prose/views/post.js
	
prose.min.js: prose.js
	uglifyjs prose.js -c -m > prose.min.js
