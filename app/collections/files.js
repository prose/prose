var _ = require('underscore');
var Backbone = require('backbone');
var File = require('../models/file');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: File,

  initialize: function(models, options) {
    this.repo = options.repo;
    this.branch = options.branch;
    this.sha = options.sha;

    this.url = config.api + '/repos/' + this.repo.get('owner').login + '/' + 
      this.repo.get('name') + '/git/trees/' + this.sha + '?recursive=1';

    this.comparator = function(file) {
      return file.get('name');
    };
  },

  parse: function(resp, options) {
    return _.map(resp.tree, (function(branch) {
     return  _.extend(branch, {
        repo: this.repo
      })
    }).bind(this));
  }
});
