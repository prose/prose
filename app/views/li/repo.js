var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.li.repo),

  tagName: 'li',

  className: 'item clearfix',

  initialize: function(options) {
    this.model = options.model;

    this.listenTo(this.model, 'sync', this.render, this);
  },

  render: function() {
    this.$el.data('navigate', '#' + this.model.get('owner').login + '/' + this.model.get('name'));
    this.$el.data('id', this.model.id);

    this.$el.html(this.template(this.model.attributes));

    return this;
  }
});
