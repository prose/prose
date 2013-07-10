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

    subviews: [],

    initialize: function(options) {
      _.bindAll(this);

      this.user = options.user;

      // Sidebar
      this.sidebar = new SidebarView({
        app: this,
        user: this.user
      });
      this.subviews.push(this.sidebar);

      // Nav
      this.nav = new NavView({
        app: this,
        sidebar: this.sidebar,
        user: this.user
      });

      this.subviews.push(this.nav);

      // Key Binding support accross the application.
      key('j, k, enter, o', _.bind(function(e, handler) {
        if (!app.state.mode || app.state.mode === 'tree') {
          // We are in any navigation view
          if (handler.key === 'j' || handler.key === 'k') {
            utils.pageListing(handler.key);
          } else {
            utils.goToFile();
          }
        }
      }, this));
    },

    render: function(options) {
      var view = this;
      var isJekyll = false;
      var errorPage = false;
      var hideInterface = false; // Flag for unauthenticated landing
      this.noMenu = false; // Prevents a mobile toggle from appearing when nto required.

      if (options) {
        if (options.hideInterface) hideInterface = options.hideInterface;
        if (options.jekyll) isJekyll = options.jekyll;
        if (options.noMenu) this.noMenu = options.noMenu;
        if (options.error) errorPage = options.error;
      }

      // TODO: replace with this.hide()
      if (hideInterface) {
        $(this.el).toggleClass('disable-interface', true);
      } else {
        $(this.el).toggleClass('disable-interface', false);
      }

      console.log(this.model);
      var app = {
        authed: true
      };

      this.$el.empty().append(_.template(this.template, app, {
        variable: 'app'
      }));

      // When the sidebar should be open.
      // Fix this in re-factor, could be much tighter
      /*
      if (app.state.mode === 'tree' ||
          app.state.mode === '' && window.authenticated && app.state.user) {
        $('#prose').toggleClass('open', true);
        $('#prose').toggleClass('mobile', false);
      } else {
        $('#prose').toggleClass('open mobile', false);
      }
      */

      this.sidebar.setElement(this.$el.find('#drawer')).render();
      this.nav.setElement(this.$el.find('nav')).render();

      return this;
    },

    remove: function() {
      _.invoke(this.subviews, 'remove');
      this.subviews = [];

      Backbone.View.prototype.remove.call(this, arguments);
    }
});
