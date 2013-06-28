var $ = require('jquery-browserify');
var _ = require('underscore');

var LOCALES = require('../translations/locales');
var en = require('../dist/en.js');

var Backbone = require('backbone');
var Router = require('./Router');

var User = require('./models/user');

var NotificationView = require('./views/notification');

var config = require('./config');
var cookie = require('./cookie');

// Set locale as global variable
window.locale.en = en;
window.locale.current('en');

// Set up translations
var browserLang = (navigator.language || navigator.userLanguage).split('-')[0];
var locale;

// Check if the browsers language is supported
if (LOCALES.indexOf(browserLang) != -1) locale = browserLang;

if (locale && locale !== 'en') {
  $.getJSON('./translations/locales/' + locale + '.json', function(result) {
    window.locale[locale] = result;
    window.locale.current(locale);
  });
}

var user = new User();

user.authenticate({
  success: function() {
    if ('withCredentials' in new XMLHttpRequest()) {
      // Set OAuth header for all CORS requests
      $.ajaxSetup({
        headers: {
          'Authorization': config.auth === 'oauth' ? 
            'token ' + cookie.get('oauth-token') :
            'Basic ' + Base64.encode(config.username + ':' + config.password)
        }
      });

      // Set User model id and login from cookies
      var id = cookie.get('id');
      if (id) user.set('id', id);

      var login = cookie.get('login');
      if (login) user.set('login', login);

      user.fetch({
        success: function(model, res, options) {
          // Set authenticated user id and login cookies
          cookie.set('id', user.get('id'));
          cookie.set('login', user.get('login'));

          // Initialize router
          window.router = new Router({ user: model });

          // Start responding to routes
          Backbone.history.start();
        },
        error: function(model, res, options) {
          // TODO: emit notification event
          var view = new NotificationView({
            'type': 'error',
            'message': t('notification.error.github')
          }).render();

          $('#prose').html(view.el);
        }
      });
    } else {
      // TODO: emit notification event
      // Display an upgrade notice.
      var tmpl = _.template(templates.upgrade);
      $('#prose').html(tmpl);
    }
  },
  error: function() {
    // Initialize router
    window.router = new Router();

    // Start responding to routes
    Backbone.history.start();
  }
});
