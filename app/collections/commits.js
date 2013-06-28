var _ = require('underscore');
var Backbone = require('backbone');
var Commit = require('../models/commit');

module.exports = Backbone.Collection.extend({
  model: Commit,

  initialize: function(models, options) {
    this.repo = options.repo;
  },

  setBranch: function(branch, options) {
    this.branch = branch;
    this.fetch(options);
  },

  parse: function(resp, options) {
    return map = _.map(resp, (function(commit) {
     return  _.extend(commit, {
        repo: this.repo
      })
    }).bind(this));
  },

  url: function() {
    return this.repo.url() + '/commits?sha=' + this.branch;
  }
});
