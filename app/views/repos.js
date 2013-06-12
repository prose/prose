var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.li.repo),

  initialize: function(options) {
    this.model = options.model;
    this.search = options.search;

    this.listenTo(this.model, 'sync', this.render, this);
    this.listenTo(this.search, 'search', this.render, this);
  },

  render: function() {
    var collection = this.search ? this.search.search() : this.model;

    this.$el.empty();

    collection.each((function(repo, index) {
      this.$el.append(this.template(repo.attributes));
    }).bind(this));

    return this;
  }
});
