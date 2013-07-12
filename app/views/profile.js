var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var HeaderView = require('./header');
var OrgsView = require('./sidebar/orgs');
var utils = require('.././util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.profile),

  subviews: {},

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
    this.subviews['header'] = header;

    if (this.auth) {
      var orgs = this.sidebar.initSubview('orgs', {
        model: this.auth.orgs,
        sidebar: this.sidebar,
        user: this.user
      });
      
      this.subviews['orgs'] = orgs;
    }

    utils.fixedScroll(this.$el.find('.topbar'));

    return this;
  },

  remove: function() {
    this.sidebar.close();

    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
