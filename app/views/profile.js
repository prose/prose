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
    this.user = user;
    this.search = options.search;
    this.repos = options.repos;
  },

  render: function() {
    this.$el.html(this.template());

    this.search.setElement(this.$el.find('#search')).render();
    this.repos.setElement(this.$el.find('#repos'));

    var header = new HeaderView({ model: user, alterable: false });
    header.setElement(this.$el.find('#heading')).render();

    var sidebar = new OrgsView({ model: this.user.orgs });
    sidebar.setElement(this.$el.find('#drawer'));

    utils.fixedScroll($('.topbar'));

    return this;
  }
});
