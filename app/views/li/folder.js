var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({
  tagName: 'li',

  className: 'item clearfix',

  template: templates.li.folder,

  initialize: function(options) {
    this.model = options.model;
    this.repo = options.repo;
    this.branch = options.branch;

    this.$el.attr('data-index', options.index);
    this.$el.attr('data-navigate', '#' + this.repo.get('owner').login + '/' +
      this.repo.get('name') + '/tree/' + this.branch + '/' +
      this.model.get('path'));

    this.listenTo(this.model, 'sync', this.render, this);
  },

  render: function() {
    var data = _.extend(this.model.attributes, {
      branch: this.branch,
      repo: this.repo.attributes
    });

    this.$el.empty().append(_.template(this.template, data, {
      variable: 'folder'
    }));

    return this;
  }
});
