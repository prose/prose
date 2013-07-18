var _ = require('underscore');
var Backbone = require('backbone');
var Org = require('../models/org');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: Org,

  initialize: function(models, options) {
    options = _.clone(options) || {};
    _.bindAll(this);

    this.user = options.user;
  },

  url: function() {
    return this.user ? config.api + '/users/' + this.user.get('login') + '/orgs' :
      '/user/orgs';
  }
});
