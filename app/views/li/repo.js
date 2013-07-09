var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({
  tagName: 'li',

  className: 'item clearfix',

  template: templates.li.repo,

  initialize: function(options) {
    this.model = options.model;
    this.listenTo(this.model, 'sync', this.render, this);
  },

  render: function() {
    this.$el.data('navigate', '#' + this.model.get('owner').login + '/' + this.model.get('name'));
    this.$el.data('id', this.model.id);

    var repo = this.model.attributes;
    this.$el.empty().append(_.template(this.template, repo, {
      variable: 'repo'
    }));

    return this;
  }
});
