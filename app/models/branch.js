var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var cookie = require('../cookie');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    this.name = 'branch';
    Backbone.Model.apply(this, arguments);
  },

  initialize: function(attributes, options) {
  }
});
