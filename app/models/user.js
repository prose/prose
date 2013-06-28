var $ = require('jquery-browserify');
var _ = require('underscore');

var Backbone = require('backbone');
var Repos = require('../collections/repos');
var Orgs = require('../collections/orgs');
var NotificationView = require('../views/notification');

var config = require('../config');
var cookie = require('../cookie');
var templates = require('../../dist/templates');

module.exports = Backbone.Model.extend({
  initialize: function(attributes, options) {
    this.repos = new Repos([], { user: this });
    this.orgs = new Orgs([], { user: this });
  },

  authenticate: function(cb) {
    if (cookie.get('oauth-token')) {
      this.set('authenticated', true);
      if (_.isFunction(cb)) cb();
    } else {
      var match = window.location.href.match(/\?code=([a-z0-9]*)/);

      if (match) {
        $.getJSON(config.url + '/authenticate/' + match[1], function(data) {
          cookie.set('oauth-token', data.token);

          var regex = new RegExp("\\/\?code=" + match[1]);
          debugger;
          window.location.href = window.location.href.replace(regex, '').replace('&state=', '');

          this.set('authenticated', true);

          if (_.isFunction(cb)) cb();
        });
      } else {
        if (_.isFunction(cb)) cb();
      }
    }
  },

  logout: function() {
    cookie.unset('oauth-token');
  },

  url: function() {
    return config.api + (this.get('id') === cookie.id ? '/user' : '/users/' + this.get('login'));
  }
});
