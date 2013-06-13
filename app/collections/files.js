var Backbone = require('backbone');
var File = require('../models/file');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: File,

  initialize: function(models, options) {
    this.comparator = function(file) {
      return file.get('name');
    };

    this.url = config.api + '/repos/' + options.owner.login + '/' + 
      options.repo + '/git/trees/' + options.sha + '?recursive=1';

    this.branch = options.branch;
  },

  parse: function(resp, options) {
    return resp.tree;
  }
});
