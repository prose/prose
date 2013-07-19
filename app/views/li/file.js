var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.li.file,

  tagName: 'li',

  className: 'item clearfix',

  events: {
    'click a.delete': 'destroy'
  },

  initialize: function(options) {
    this.model = options.model;
    this.repo = options.repo;
    this.branch = options.branch;

    this.$el.attr('data-index', options.index);

    if (!this.model.get('binary')) {
      this.$el.attr('data-navigate', '#' + this.repo.get('owner').login + '/' +
        this.repo.get('name') + '/edit/' + this.branch + '/' +
        this.model.get('path'));
    }
  },

  render: function() {
    var data = _.extend(this.model.attributes, {
        branch: this.branch,
        repo: this.repo.attributes
    });

    this.$el.empty().append(_.template(this.template, data, {
      variable: 'file'
    }));

    return this;
  },

  destroy: function(e) {
    if (confirm(t('actions.delete.warn'))) {
      // TODO: on success, either reload recent commits (expensive) or append
      // to recent commits el
      this.model.destroy();
      this.$el.fadeOut('fast');
    }

    return false;
  }
});
