var Backbone = require('backbone');
var Commit = require('../models/commit');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: Commit,

  initialize: function(models, options) {
    this.repo = options.repo;
  },

  branch: function(branch, options) {
    this.branch = branch;
    this.fetch(options);
  },

  url: function() {
    return this.repo.url() + '/commits?sha=' + this.branch;
  }
});
