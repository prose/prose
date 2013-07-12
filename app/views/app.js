var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var SidebarView = require('./sidebar');
var NavView = require('./nav');
var templates = require('../../dist/templates');
var utils = require('.././util');

module.exports = Backbone.View.extend({
  className: 'application',

  template: templates.app,

  subviews: {},

  initialize: function(options) {
    _.bindAll(this);

    this.user = options.user;

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

    // Key Binding support accross the application.
    key('j, k, enter, o', (function(e, handler) {
      // TODO: only enable key bindings in navigation views
      /*
      if (handler.key === 'j' || handler.key === 'k') {
        utils.pageListing(handler.key);
      } else {
        utils.goToFile();
      }
      */
    }).bind(this));
  },

  render: function(options) {
    var view = this;
    this.$el.empty().append(_.template(this.template));

    this.sidebar.setElement(this.$el.find('#drawer')).render();
    this.nav.setElement(this.$el.find('nav')).render();

    return this;
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
