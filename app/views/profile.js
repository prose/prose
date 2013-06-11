var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('.././util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.profile),

  initialize: function(options) {
    this.search = options.search;
    this.repos = options.repos;
  },

  render: function() {
    this.$el.html(this.template());

    this.search.setElement(this.$el.find('#search')).render();
    this.repos.setElement(this.$el.find('#repos'));

    _.delay(function () {
      utils.fixedScroll($('.topbar'));
      $('#filter').focus();
    }, 1);

    return this;
  }
});
