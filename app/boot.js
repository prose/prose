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
  var user = new User();
}
