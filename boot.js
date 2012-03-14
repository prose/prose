---
---
{% include vendor/jquery-1.7.1.min.js %}
{% include vendor/underscore-min.js %}
{% include vendor/backbone-min.js %}
{% include vendor/js-yaml.min.js %}
{% include vendor/chrono.js %}
{% include vendor/showdown.js %}
{% include vendor/textile.js %}
{% include vendor/base64.js %}
{% include vendor/github.js %}
{% include vendor/codemirror/codemirror.js %}
{% include vendor/codemirror/xml.js %}
{% include vendor/codemirror/markdown.js %}
{% include vendor/jquery.cookie.js %}

window.app = {
    config: {},
    models: {},
    views: {},
    routers: {},
    utils: {},
    templates: _($('script[name]')).reduce(function(memo, el) {
        memo[el.getAttribute('name')] = _(el.innerHTML).template();
        return memo;
    }, {}),
    state: {"repo": ""},
    instance: {},
};

window.args = _(window.app).toArray();

// Authenticate
var credentials = getCredentials();
if (credentials) _.extend(app, credentials);

{% include util.js %}
{% include model.js %}
{% include routers/application.js %}
{% include views/application.js %}
{% include views/start.js %}
{% include views/header.js %}
{% include views/posts.js %}
{% include views/post.js %}
{% include views/new_post.js %}


(function(config, models, views, routers, utils, templates) {
  $(function() {

    loadApplication(function(err, data) {
      // Start the engines
      window.app.instance = new views.Application({ el: '#container', model: data }).render();

      // Initialize router
      window.router = new routers.Application({});
      
      // Start responding to routes
      Backbone.history.start();
    });
  });
}).apply(this, window.args);
