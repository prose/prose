var _ = require('underscore');
var Backbone = require('backbone');
var Commit = require('../models/commit');

module.exports = Backbone.Collection.extend({
  model: Commit,

  initialize: function(models, options) {
    console.log('initializing commits')
    this.repo = options.repo;
    this.file = options.file;
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
    if (this.file) {
      return this.repo.url() + '/commits?sha=' + this.file.get('branch').get('name') + '&path=' + this.file.get('path');
    } else {
      return this.repo.url() + '/commits?sha=' + this.branch;
    }
  }
});
