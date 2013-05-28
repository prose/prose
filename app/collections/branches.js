var $ = require('jquery-browserify');
var _ = require('underscore');

var Backbone = require('backbone');
Backbone.sync = require('../backbone-github');

var Branch = require('../models/branch');
var cookie = require('../cookie');

module.exports = Backbone.Collection.extend({
  model: Branch,

  constructor: function(models, options) {
    this.name = 'branches';
    Backbone.Collection.apply(this, arguments);
  },

  initialize: function(models, options) {
    this.fetch({
      'user': options.user,
      'repo': options.repo
    });
  }
});
