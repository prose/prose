var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var HeaderView = require('./header');
var OrgsView = require('./sidebar/orgs');
var utils = require('.././util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.profile),

  subviews: [],

  initialize: function(options) {
    this.auth = options.auth;
    this.user = options.user;
    this.search = options.search;
    this.sidebar = options.sidebar;
    this.repos = options.repos;
  },

  render: function() {
    this.$el.html(this.template());

    this.search.setElement(this.$el.find('#search')).render();
    this.repos.setElement(this.$el.find('#repos'));

    var header = new HeaderView({ user: this.user, alterable: false });
    header.setElement(this.$el.find('#heading')).render();
    this.subviews.push(header);

    if (this.auth) {
      this.orgs = new OrgsView({ model: this.auth.orgs });
      this.orgs.setElement(this.sidebar.$el.find('#orgs'));
      this.subviews.push(this.orgs);

      this.auth.orgs.fetch({
        success: (function() {
          this.orgs.render();
        }).bind(this)
      });
    }

    utils.fixedScroll(this.$el.find('.topbar'));

    return this;
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = [];

    Backbone.View.prototype.remove.call(this);
  }
});
