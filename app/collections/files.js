var Backbone = require('backbone');
Backbone.sync = require('../backbone-github');

var File = require('../models/file');

module.exports = Backbone.Collection.extend({
  model: File,

  constructor: function(models, options) {
    this.name = 'files';
    Backbone.Collection.apply(this, arguments);
  },

  initialize: function(models, options) {
    this.fetch({
      'user': options.user,
      'repo': options.repo,
      'branch': options.branch
    });
  }
});
