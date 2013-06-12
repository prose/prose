var Backbone = require('backbone');
var Repo = require('../models/repo');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: Repo,

  initialize: function(models, options) {
    this.url = config.api + (options.username ? '/users/' + options.username + '/repos' : '/user/repos');
    this.user = options.user;
  }
});
