var LOCALES = require('../translations/locales');
var en = require('../dist/en.js');

// Set locale as global variable
window.locale.en = en;
window.locale.current('en');
window.app = {};

var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var Router = require('./router');
var User = require('./models/user');
var NotificationView = require('./views/notification');
var config = require('./config');
var cookie = require('./cookie');
var auth = require('./config');
var status = require('./status');

// Set up translations
var setLanguage = (cookie.get('lang')) ? true : false;

// Check if the browsers language is supported
if (setLanguage) app.locale = cookie.get('lang');

if (app.locale && app.locale !== 'en') {
  $.getJSON('./translations/locales/' + app.locale + '.json', function(result) {
    window.locale[app.locale] = result;
    window.locale.current(app.locale);
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

      // Set an 'authenticated' class to #prose
      $('#prose').addClass('authenticated');

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
          var apiStatus = status.githubApi(function(res) {

            var error = new NotificationView({
              'message': t('notification.error.github'),
              'options': [
                {
                  'title': t('notification.back'),
                  'link': '/'
                },
                {
                  'title': t('notification.githubStatus', {
                    status: res.status
                  }),
                  'link': '//status.github.com',
                  'className': res.status
                }
              ]
            });

            $('#prose').html(error.render().el);
          });
        }
      });
    } else {
      var upgrade = new NotificationView({
        'message': t('main.upgrade.content'),
        'options': [{
          'title': t('main.upgrade.download'),
          'link': 'https://www.google.com/intl/en/chrome/browser'
        }]
      });

      $('#prose').html(upgrade.render().el);
    }
  },
  error: function() {
    // Initialize router
    window.router = new Router();

    // Start responding to routes
    Backbone.history.start();
  }
});
