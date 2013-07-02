var $ = require('jquery-browserify');
var _ = require('underscore');
var cookie = require('./cookie');
var Backbone = require('backbone');
var LOCALES = require('../../translations/locales');
var en = require('../../dist/en.js');

window.locale.en = en;
window.locale.current('en');

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
      Documentation: require('./views/documentation'),
      ChooseLanguage: require('./views/chooselanguage')
    },
    templates: require('../../dist/templates'),
    router: require('./router'),
    utils: {},
    state: {'repo': ''},
    instance: {},
    eventRegister: _.extend({}, Backbone.Events)
};

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

// Bootup
// test the browser supports CORS and return a boolean for an oauth token.
if ('withCredentials' in new XMLHttpRequest()) {
  if (app.models.authenticate()) {
    app.models.loadApplication(function(err, data) {
      if (err) {
        var view = new window.app.views.Notification({
          'type': 'error',
          'message': t('notification.error.github')
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
} else {
  // Display an upgrade notice.
  var tmpl = _(window.app.templates.upgrade).template();

  _.defer(function() {
    $('#prose').empty().append(tmpl);
  });
}
