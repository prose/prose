var _ = require('underscore');
var Backbone = require('backbone');
var Branch = require('../models/branch');

module.exports = Backbone.Collection.extend({
  model: Branch,

  initialize: function(models, options) {
    this.repo = options.repo;
  },

  parse: function(resp, options) {
    return map = _.map(resp, (function(branch) {
     return  _.extend(branch, {
        repo: this.repo
      })
    }).bind(this));
  },

  url: function() {
    return this.repo.url() + '/branches';
  }
});
