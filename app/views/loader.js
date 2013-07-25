var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.loading,

  initialize: function() {
    _.bindAll(this);
  },

  start: function(message) {
    this.$el.find('.message').html(message).show();
  },

  stop: function() {
    this.$el.find('.loading').fadeOut(150);
  },

  render: function() {
    this.$el.html(_.template(this.template, {}, { variable: 'data' }));
    return this;
  }
});
