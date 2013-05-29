var Backbone = require('backbone');
Backbone.sync = require('../backbone-github');

var Commit = require('../models/commit');

module.exports = Backbone.Collection.extend({
  model: Commit,

  constructor: function(models, options) {
    this.name = 'commits';
    Backbone.Collection.apply(this, arguments);
  },

  initialize: function(models, options) {
    this.fetch({
      'user': options.user,
      'repo': options.repo,
      'branch': options.branch,
      'path': options.path
    });
  }
});
