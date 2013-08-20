var $ = require('jquery-browserify');
var _ = require('underscore');

var Backbone = require('backbone');
var Repos = require('../collections/repos');
var Orgs = require('../collections/orgs');

// TODO Pass Notification view here if something goes wrong?
var NotificationView = require('../views/notification');

var auth = require('../config');
var cookie = require('../cookie');
var templates = require('../../dist/templates');

module.exports = Backbone.Model.extend({
  initialize: function(attributes, options) {
    this.repos = new Repos([], { user: this });
    // this.orgs = new Orgs([], { user: this });
  },

  authenticate: function(options) {
    
    console.log(">>> authenticating...")
    
    if (cookie.get('oauth-token')) {
      console.log(">>> we have the oauth token")
      if (_.isFunction(options.success)) options.success();
    } else {
      console.log(">>> no oauth token, making request")
      var ajax = $.ajax(auth.api + '/user', {
        success: function(data) {
          console.log(">>> successful request...")
          cookie.set('oauth-token', data.token);
          if (_.isFunction(options.success)) options.success();
        },
        error: function() {
          console.log(">>> error request")
          if (_.isFunction(options.error)) options.error();
        }
      });
    }
    
  },

  url: function() {
    var id = cookie.get('id');
    var token = cookie.get('oauth-token');

    // Return '/user' if authenticated but no user id cookie has been set yet
    // or if this model's id matches authenticated user id
    return auth.api + ((token && _.isUndefined(id)) || (id && this.get('id') === id) ?
      '/user' : '/users/' + this.get('login'));
  }
});
