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
    }, {})
};

window.args = _(window.app).toArray();

// Utils: run an array of functions in serial.
window.app.utils.serial = function () {
    (_(arguments).reduceRight(_.wrap, function() {}))();
};

{% include model.js %}
{% include routers/application.js %}

{% include views/application.js %}
{% include views/header.js %}
{% include views/posts.js %}

// Keep session here?
window.session = {};

(function(config, models, views, routers, utils, templates) {
  $(function() {

  loadApplication("github-api-test", "api-test-12", function(err, data) {
    // Start the engines
    window.app = new views.Application({ el: '#container', model: data }).render();

    // Initialize router
    window.router = new routers.Application({});
    
    // Start responding to routes
    Backbone.history.start();
  });
  });
}).apply(this, window.args);
