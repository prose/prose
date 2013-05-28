var $ = require('jquery-browserify');
var _ = require('underscore');

var Backbone = require('backbone');
Backbone.sync = require('../backbone-github');

var Repo = require('../models/repo');
var cookie = require('../cookie');

module.exports = Backbone.Collection.extend({
  model: Repo,

  constructor: function(attributes, collection) {
    this.name = 'repos';
    Backbone.Collection.apply(this, arguments);
  },

  initialize: function(models, options) {
    this.fetch({
      'user': options.user
    });
  }
});
