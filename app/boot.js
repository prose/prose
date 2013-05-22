var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');

window.app = {
    config: {},
    models: require('./models'),
    views: {
      App: require('./views/app'),
      Notification: require('./views/notification'),
      Start: require('./views/start'),
      Preview: require('./views/preview'),
      Profile: require('./views/profile'),
      Posts: require('./views/posts'),
      Post: require('./views/post'),
      Documentation: require('./views/documentation')
    },
    templates: require('../dist/templates'),
    router: require('./router'),
    utils: {},
    state: {'repo': ''},
    instance: {},
    eventRegister: _.extend({}, Backbone.Events)
};

// Bootup
if (app.models.authenticate()) {
  app.models.loadApplication(function(err, data) {
    if (err) {
      var view = new window.app.views.Notification({
        'type': 'eror',
        'message': 'Error while loading data from Github. This might be a temporary issue. Please try again later.'
      }).render();

      $('#prose').empty().append(view.el);
    } else {

      // Initialize router
      window.router = new app.router({
        model: data
      });

      // Start responding to routes
      Backbone.history.start();
    }
  });
}
