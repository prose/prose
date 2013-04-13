var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var model = require('./model');

window.app = {
    config: {},
    models: {},
    views: {
      Application: require(__dirname, 'views/application'),
      App: require(__dirname, 'views/app'),
      Notification: require(__dirname, 'views/notification'),
      Start: require(__dirname, 'views/start'),
      Profile: require(__dirname, 'views/profile'),
      Posts: require(__dirname, 'views/posts'),
      Post: require(__dirname, 'views/post'),
      Preview: require(__dirname, 'views/preview')
    },
    routers: {
      Application: require(__dirname, 'routers/application')
    },
    utils: {},
    state: {'repo': ''},
    instance: {},
    eventRegister: _.extend({}, Backbone.Events)
};

window.args = _(window.app).toArray();

// Prevent exit when there are unsaved changes
window.onbeforeunload = function() {
  if (window.app.instance.mainView && window.app.instance.mainView.dirty)
    return 'You have unsaved changes. Are you sure you want to leave?';
};

window.confirmExit = function() {
  if (window.app.instance.mainView && window.app.instance.mainView.dirty)
    return confirm('You have unsaved changes. Are you sure you want to leave?');
  return true;
};

$(function() {
  if (model.authenticate) {
    model.loadApplication(function(err, data) {
      // Start the engines
      window.app.instance = new app.views.Application({
        el: '#prose',
        model: data
      }).render();

      if (err) return app.instance.notify('error', 'Error while loading data from Github. This might be a temporary issue. Please try again later.');

      // Initialize router
      window.router = new app.routers.Application();

      // Start responding to routes
      Backbone.history.start();
    });
  }
});
