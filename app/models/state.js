var Backbone = require('backbone');
var config = require('../config');
var cookie = require('../cookie');

var State = Backbone.Model.extend({
  defaults: {
    user: '',
    repo: '',
    mode: 'page',
    branch: '',
    path: '',
    file: ''
  },

  initialize: function(attributes, options) {
  },

  authenticate: function() {
    if (cookie.get('oauth-token')) return window.authenticated = true;

    var match = window.location.href.match(/\?code=([a-z0-9]*)/);

    // set oauth-token cookie
    if (match) {
      $.getJSON(auth.url + '/authenticate/' + match[1], function (data) {
        cookie.set('oauth-token', data.token);
        window.authenticated = true;

        // Adjust URL
        var regex = new RegExp("\\?code=" + match[1]);
        window.location.href = window.location.href.replace(regex, '').replace('&state=', '');
      });
      return false;
    } else {
      return true;
    }
  },

  logout: function() {
    window.authenticated = false;
    cookie.unset('oauth-token');
  }
});

module.exports = new State();
