var Backbone = require('backbone');
var Org = require('../models/org');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: Org,

  initialize: function(models, options) {
    this.url = config.api + (options.username ? '/users/' + options.username + '/orgs' : '/user/orgs');
    this.user = options.user;
  },

  load: function(options) {
    this.fetch({ reset: true });
  }
});
