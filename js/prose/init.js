;(function(config, models, views, routers, utils, templates) {
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

