var _ = require('underscore');
var Backbone = require('backbone');
var Org = require('../models/org');
var config = require('../config');
var cookie = require('../cookie');

module.exports = Backbone.Collection.extend({
  model: Org,

  initialize: function(models, options) {
    options = _.clone(options) || {};
    _.bindAll(this);

    this.user = options.user;
  },

  url: function() {
    var token = cookie.get('oauth-token');

    // If not authenticated, show public repos for user in path.
    // https://developer.github.com/v3/orgs/#list-user-organizations
    if (!token) {
      return config.api + '/users/' + this.user.get('login') + '/orgs';
    }

    // Authenticated users see all repos they have access to.
    // https://developer.github.com/v3/orgs/#list-your-organizations
    else {
      return config.api + '/user/orgs';
    }
  }
});
