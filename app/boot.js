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

$.ajaxSetup({
  headers: {
    'Authorization': config.auth === 'oauth' ? 
      'token ' + cookie.get('oauth-token') :
      'Basic ' + Base64.encode(config.username + ':' + config.password)
  }
});

var user = new User();

user.authenticate(function() {
  // CORS compatibility test
  if ('withCredentials' in new XMLHttpRequest()) {
    user.fetch({
      success: function(model, res, options) {
        // Set authenticated user cookie
        cookie.set('user', {
          id: user.get('id'),
          login: user.get('login')
        });

        // Initialize router
        window.router = new Router({ user: model });

        // Start responding to routes
        Backbone.history.start();
      },
      error: function() {
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
});
