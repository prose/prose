var Backbone = require('backbone');
var $ = require('jquery-browserify');
var _ = require('underscore');
var model = require('./model');

console.log(model);

window.app = {
    config: {},
    models: {},
    views: {
      Application: require('./views/application'),
      App: require('./views/app'),
      Notification: require('./views/notification'),
      Start: require('./views/start'),
      Profile: require('./views/profile'),
      Posts: require('./views/posts'),
      Post: require('./views/post'),
      Preview: require('./views/preview')
    },
    routers: {
      Application: require('./routers/application')
    },
    utils: {},
    templates: require('../../templates/templates'),
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

function confirmExit() {
  if (window.app.instance.mainView && window.app.instance.mainView.dirty)
    return confirm('You have unsaved changes. Are you sure you want to leave?');
  return true;
}

$(function() {
  if (model.authenticate) {
    model.loadApplication(function(err, data) {
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
