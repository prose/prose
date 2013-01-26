---
---
{% include vendor/jquery.min.js %}
{% include vendor/underscore-min.js %}
{% include vendor/backbone-min.js %}
{% include vendor/js-yaml.min.js %}
{% include vendor/chrono.js %}
{% include vendor/marked.js %}
{% include vendor/base64.js %}
{% include vendor/github.js %}
{% include vendor/diff-match-patch.js %}
{% include vendor/keymaster.js %}
{% include vendor/codemirror/codemirror.js %}
{% include vendor/codemirror/xml.js %}
{% include vendor/codemirror/markdown.js %}
{% include vendor/codemirror/gfm.js %}
{% include vendor/codemirror/javascript.js %}
{% include vendor/codemirror/css.js %}
{% include vendor/codemirror/clojure.js %}
{% include vendor/codemirror/textile.js %}
{% include vendor/codemirror/coffeescript.js %}
{% include vendor/codemirror/less.js %}
{% include vendor/codemirror/htmlmixed.js %}
{% include vendor/codemirror/rst.js %}
{% include vendor/codemirror/clike.js %}
{% include vendor/codemirror/ruby.js %}
{% include vendor/codemirror/yaml.js %}
{% include vendor/jquery.cookie.js %}
{% include vendor/bsocket.js %}
{% include vendor/share.js %}
{% include vendor/cm.js %}

window.app = {
    config: {rootUrl: '{{ site.rootUrl }}', syncUrl: '{{ site.sync_url }}'},
    models: {},
    views: {},
    routers: {},
    utils: {},
    templates: {},
    state: {'repo': ''},
    instance: {}
};

{% include templates.js %}
{% include app.js %}

