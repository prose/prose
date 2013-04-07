window.app = {
    config: {},
    models: {},
    views: {},
    routers: {},
    utils: {},
    templates: _($('script[data-template]')).reduce(function(memo, el) {
        memo[el.getAttribute('data-template')] = _(el.innerHTML).template();
        return memo;
    }, {}),
    state: {'repo': ''},
    instance: {},
    eventRegister: _.extend({}, Backbone.Events)
};

// Prevent exit when there are unsaved changes
window.onbeforeunload = function() {
  if (window.app.instance.mainView && window.app.instance.mainView.dirty)
    return 'You have unsaved changes. Are you sure you want to leave?';
};

function confirmExit() {
  if (window.app.instance.mainView && window.app.instance.mainView.dirty)
    return confirm('You have unsaved changes. Are you sure you want to leave?');
  return true;
}

(function(config, models, views, routers, utils, templates) {
  $(function() {
    if (authenticate()) {
      loadApplication(function(err, data) {
        // Start the engines
        window.app.instance = new views.Application({
          el: '#prose',
          model: data
        }).render();

        if (err) return app.instance.notify('error', 'Error while loading data from Github. This might be a temporary issue. Please try again later.');

        // Initialize router
        window.router = new routers.Application({});

        // Start responding to routes
        Backbone.history.start();
      });
    }
  });
}).apply(this, window.args);
