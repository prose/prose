var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var HeaderView = require('./header');
var OrgsView = require('./sidebar/orgs');
var utils = require('.././util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.profile,

  subviews: {},

  initialize: function(options) {
    this.auth = options.auth;
    this.repos = options.repos;
    this.router = options.router;
    this.search = options.search;
    this.sidebar = options.sidebar;
    this.user = options.user;
  },

  render: function() {
    this.$el.empty().append(_.template(this.template));

    this.search.setElement(this.$el.find('#search')).render();
    this.repos.setElement(this.$el.find('#repos'));

    var header = new HeaderView({ user: this.user, alterable: false });
    header.setElement(this.$el.find('#heading')).render();
    this.subviews['header'] = header;

    if (this.auth) {
      var orgs = this.sidebar.initSubview('orgs', {
        model: this.auth.orgs,
        router: this.router,
        sidebar: this.sidebar,
        user: this.user
      });
      
      this.subviews['orgs'] = orgs;
    }

    return this;
  },

  remove: function() {
    this.sidebar.close();

    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
