var $ = require('jquery-browserify');
var _ = require('underscore');
var cookie = require('./cookie');
var config = require('./config');

var Backbone = require('backbone');
var User = require('./models/user');

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
  $.ajax({
    type: 'GET',
    url: config.api + '/user',
    contentType: 'application/x-www-form-urlencoded',
    headers: {
      'Authorization': 'token ' + cookie.get('oauth-token')
    },
    success: function(res, textStatus, xhr) {
      var user = new User(res);

      cookie.set('avatar', user.get('avatar_url'));
      cookie.set('username', user.get('login'));

      // Initialize router
      window.router = new app.router({
        model: user
      });

      // Start responding to routes
      Backbone.history.start();
    },
    error: function(err) {
      var view = new window.app.views.Notification({
        'type': 'eror',
        'message': 'Error while loading data from Github. This might be a temporary issue. Please try again later.'
      }).render();

      $('#prose').empty().append(view.el);
    }
  });
}
