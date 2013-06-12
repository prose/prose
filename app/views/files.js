var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.li.file),

  initialize: function(options) {
    this.model = options.model;
    this.repo = options.repo;
    this.branch = options.branch || this.repo.get('master_branch');
    this.listenTo(this.model, 'sync', this.render, this);
  },

  render: function(collection, options) {
    this.$el.empty();

    collection.each((function(file, index) {
      this.$el.append(this.template(file.attributes));
    }).bind(this));

    return this;
  }
});
