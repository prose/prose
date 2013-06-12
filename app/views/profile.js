var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var HeaderView = require('./header');
var OrgsView = require('./orgs');
var utils = require('.././util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.profile),

  subviews: [],

  initialize: function(options) {
    this.auth = options.auth;
    this.user = options.user;
    this.search = options.search;
    this.repos = options.repos;
  },

  render: function() {
    this.$el.html(this.template());

    this.search.setElement(this.$el.find('#search')).render();
    this.repos.setElement(this.$el.find('#repos'));

    var header = new HeaderView({ model: this.user, alterable: false });
    header.setElement(this.$el.find('#heading')).render();
    this.subviews.push(header);

    var sidebar = new OrgsView({ model: this.auth.orgs });
    sidebar.setElement(this.$el.find('#drawer'));
    this.subviews.push(sidebar);

    utils.fixedScroll(this.$el.find('.topbar'));

    return this;
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = [];

    Backbone.View.prototype.remove.call(this);
  }
});
