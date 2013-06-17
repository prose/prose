var $ = require('jquery-browserify');
var _ = require('underscore');
var config = require('./config');

var Backbone = require('backbone');
var User = require('./models/user');
var state = require('./models/state');

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

$.ajaxSetup({
  headers: {
    'Accept': 'application/vnd.github.raw',
    'Authorization': config.auth === 'oauth' ? 
      'token '+ config.token :
      'Basic ' + Base64.encode(config.username + ':' + config.password)
  }
});

var user = new User();
