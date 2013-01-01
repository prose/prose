---
---
{% include vendor/jquery-1.7.1.min.js %}
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


window.app = {
    config: {rootUrl: '{{ site.rootUrl }}'},
    models: {},
    views: {},
    routers: {},
    utils: {},
    templates: _($('script[name]')).reduce(function(memo, el) {
        memo[el.getAttribute('name')] = _(el.innerHTML).template();
        return memo;
    }, {}),
    state: {'repo': ''},
    instance: {}
};

{% include app.js %}

