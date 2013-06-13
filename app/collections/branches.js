var _ = require('underscore');
var Backbone = require('backbone');
var Branch = require('../models/branch');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: Branch,

  initialize: function(models, options) {
    this.repo = options.repo;
    this.url = config.api + '/repos/' + this.repo.get('owner').login + '/' +
      this.repo.get('name') + '/branches';
  },

  parse: function(resp, options) {
    return map = _.map(resp, (function(branch) {
     return  _.extend(branch, {
        repo: this.repo
      })
    }).bind(this));
  }
});
