var $ = require('jquery-browserify');
var _ = require('underscore');
var config = require('./config');
var LOCALES = require('../translations/locales');
var en = require('../dist/en.js');

var Backbone = require('backbone');
var User = require('./models/user');
var state = require('./models/state');

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

// Set up translations
var browserLang = (navigator.language || navigator.userLanguage).split('-')[0];

// Check if the browsers language is supported
if (LOCALES.indexOf(browserLang) != -1) app.locale = browserLang;

if (app.locale && app.locale !== 'en') {
    $.getJSON('./translations/locales/' + app.locale + '.json', function(result) {
        window.locale[app.locale] = result;
        window.locale.current(app.locale);
    });
}

$.ajaxSetup({
  headers: {
    'Authorization': config.auth === 'oauth' ? 
      'token '+ config.token :
      'Basic ' + Base64.encode(config.username + ':' + config.password)
  }
});

var user = new User();
