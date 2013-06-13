var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.li.file),

  tagName: 'li',

  className: 'item clearfix',

  initialize: function(options) {
    this.model = options.model;
    this.repo = options.repo;
    this.branch = options.branch;

    this.listenTo(this.model, 'sync', this.render, this);
  },

  render: function() {
    if (!this.model.get('isBinary')) {
      this.$el.data('navigate', '#' + this.model.get('owner').login + '/' +
        this.repo.get('name') + '/edit/' + this.branch + '/' +
        this.model.get('path'));
    }

    this.$el.html(this.template(_.extend(this.model.attributes, {
      branch: this.branch,
      permissions: this.repo.get('permissions')
    })));

    return this;
  }
});
