var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var HeaderView = require('./header');
var OrgsView = require('./orgs');
var utils = require('.././util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.profile),

  initialize: function(options) {
    this.auth = options.auth;
    this.user = options.user;
    this.search = options.search;
    this.repos = options.repos;
    this.subviews = [];
  },

  render: function() {
    this.$el.html(this.template());

    this.search.setElement(this.$el.find('#search')).render();
    this.repos.setElement(this.$el.find('#repos'));

    var header = new HeaderView({ model: this.user, alterable: false });
    header.setElement(this.$el.find('#heading')).render();

    var sidebar = new OrgsView({ model: this.auth.orgs });
    sidebar.setElement(this.$el.find('#drawer'));

    utils.fixedScroll(this.$el.find('.topbar'));

    this.subviews = [header, sidebar];

    return this;
  },

  remove: function() {
    this.subviews.each(function(subview) { subview.remove(); });
    Backbone.View.prototype.remove.call(this);
  }
});
