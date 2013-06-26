var _ = require('underscore');
var Backbone = require('backbone');
var File = require('../models/file');
var Folder = require('../models/folder');

module.exports = Backbone.Collection.extend({
  model: function(attributes, options) {
    switch(attributes.type) {
      case 'blob':
        return new File(attributes, options);
        break;
      case 'tree':
        return new Folder(attributes, options);
        break;
      default:
        throw 'Unrecognized Type';
        break;
    }
  },

  initialize: function(models, options) {
    this.repo = options.repo;
    this.branch = options.branch;
    this.sha = options.sha;

    this.comparator = function(file) {
      return file.get('name');
    };
  },

  parse: function(resp, options) {
    return _.map(resp.tree, (function(file) {
      return  _.extend(file, {
        branch: this.branch,
        collection: this,
        repo: this.repo
      })
    }).bind(this));
  },

  url: function() {
    return this.repo.url() + '/git/trees/' + this.sha + '?recursive=1';
  }
});
