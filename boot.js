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
{% include vendor/keymaster.js %}
{% include vendor/codemirror/codemirror.js %}
{% include vendor/codemirror/xml.js %}
{% include vendor/codemirror/markdown.js %}
{% include vendor/codemirror/gfm.js %}
{% include vendor/codemirror/javascript.js %}
{% include vendor/codemirror/yaml.js %}
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
    state: {'repo': ''},
    instance: {}
};

window.args = _(window.app).toArray();


{% include util.js %}
{% include model.js %}
{% include routers/application.js %}
{% include views/application.js %}
{% include views/notification.js %}
{% include views/start.js %}
{% include views/header.js %}
{% include views/posts.js %}
{% include views/post.js %}


// Prevent exit when there are unsaved changes
window.onbeforeunload = function() {
  if (window.app.instance.mainView && window.app.instance.mainView.dirty)
    return "You have unsaved changes. Are you sure you want to leave?";
};

function confirmExit() {
  if (window.app.instance.mainView && window.app.instance.mainView.dirty)
    return confirm("You have unsaved changes. Are you sure you want to leave?");
  return true;
}


(function(config, models, views, routers, utils, templates) {
  $(function() {

    if (authenticate()) {
      loadApplication(function(err, data) {

        // Start the engines
        window.app.instance = new views.Application({ el: '#container', model: data }).render();
        if (err) return app.instance.notify('error', 'Error while loading data from Github. This might be a temporary issue. Please try again later.');

        if (!window.location.href.match(/\.html/)) {
          // Initialize router
          window.router = new routers.Application({});

          // Start responding to routes
          Backbone.history.start();        
        }
      });
    }
  });
}).apply(this, window.args);
