var $ = require('jquery-browserify');
var _ = require('underscore');

var Backbone = require('backbone');
var Repos = require('../collections/repos');
var Orgs = require('../collections/orgs');
var NotificationView = require('../views/notification');

var auth = require('../config');
var cookie = require('../cookie');
var templates = require('../../dist/templates');

module.exports = Backbone.Model.extend({
  initialize: function(attributes, options) {
    this.repos = new Repos([], { user: this });
    this.orgs = new Orgs([], { user: this });
  },

  authenticate: function(options) {
    if (cookie.get('oauth-token')) {
      this.set('authenticated', true);
      if (_.isFunction(options.success)) options.success();
    } else {
      var match = window.location.href.match(/\?code=([a-z0-9]*)/);

      if (match) {
        var ajax = $.ajax(auth.url + '/authenticate/' + match[1], {
          success: function(data) {
            cookie.set('oauth-token', data.token);

            var regex = new RegExp("(?:\\/)?\\?code=" + match[1]);
            window.location.href = window.location.href.replace(regex, '');

            this.set('authenticated', true);

            if (_.isFunction(options.success)) options.success();
          }
        });
      } else {
        if (_.isFunction(options.error)) options.error();
      }
    }
  },

  logout: function() {
    cookie.unset('oauth-token');
  },

  url: function() {
    return auth.api + (this.get('id') === cookie.id ? '/user' : '/users/' + this.get('login'));
  }
});
