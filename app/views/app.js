var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var LoaderView = require('./loader');
var SidebarView = require('./sidebar');
var NavView = require('./nav');
var cookie = require('../cookie');
var templates = require('../../dist/templates');
var util = require('../util');

module.exports = Backbone.View.extend({
  className: 'application',

  template: templates.app,

  subviews: {},

  events: {
    'click a.logout': 'logout'
  },

  initialize: function(options) {
    _.bindAll(this);

    key('j, k, enter, o', (function(e, handler) {
      if (this.$el.find('.listing')[0]) {
        if (handler.key === 'j' || handler.key === 'k') {
          util.pageListing(handler.key);
        } else {
          util.goToFile();
        }
      }
    }).bind(this));

    this.user = options.user;

    // Loader
    this.loader = new LoaderView();
    this.subviews['loader'] = this.loader;

    // Sidebar
    this.sidebar = new SidebarView({
      app: this,
      user: this.user
    });
    this.subviews['sidebar'] = this.sidebar;

    // Nav
    this.nav = new NavView({
      app: this,
      sidebar: this.sidebar,
      user: this.user
    });
    this.subviews['nav'] = this.nav;
  },

  render: function() {
    this.$el.html(_.template(this.template, {}, { variable: 'data' }));

    this.loader.setElement(this.$el.find('#loader')).render();
    this.sidebar.setElement(this.$el.find('#drawer')).render();
    this.nav.setElement(this.$el.find('nav')).render();

    return this;
  },

  logout: function() {
    cookie.unset('oauth-token');
    cookie.unset('id');
    window.location.reload();
    return false;
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
