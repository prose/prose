var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var SidebarView = require('./sidebar');
var NavView = require('./nav');
var templates = require('../../dist/templates');
var utils = require('.././util');

module.exports = Backbone.View.extend({
    className: 'application',

    template: _.template(templates.app),

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
        sidebar: this.sidebar
      });
      this.subviews.push(this.nav);

      // Key Binding support accross the application.
      if (!window.shortcutsRegistered) {
        key('j, k, enter, o, ctrl+s', _.bind(function(e, handler) {
          if (!app.state.mode || app.state.mode === 'tree') {
            // We are in any navigation view
            if (handler.key === 'j' || handler.key === 'k') {
              utils.pageListing(handler.key);
            } else {
              utils.goToFile();
            }
          } else {
            // We are in state of the application
            // where we can edit a file
            if (handler.key === 'ctrl+s') {
              this.updateFile();
            }
          }
        }, this));

        window.shortcutsRegistered = true;
      }

      app.state = {
        user: '',
        repo: '',
        mode: '',
        branch: '',
        path: ''
      };

      this.eventRegister = app.eventRegister;

      this.eventRegister.bind('documentTitle', this.documentTitle);
      this.eventRegister.bind('headerContext', this.headerContext);
      this.eventRegister.bind('recentFiles', this.recentFiles);
      this.eventRegister.bind('updateSaveState', this.updateSaveState);
      this.eventRegister.bind('closeSettings', this.closeSettings);
      this.eventRegister.bind('filenameInput', this.filenameInput);
    },

    render: function(options) {
      var view = this;
      var tmpl = _(app.templates.app).template();
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

      this.data = _.extend(this.model, app.state, {
        error: errorPage,
        version: 'v1',
        jekyll: isJekyll,
        noMenu: view.noMenu,
        lang: (app.state.file) ? utils.mode(app.state.file) : undefined
      });

      this.$el.empty().append(tmpl(this.data));

      // When the sidebar should be open.
      // Fix this in re-factor, could be much tighter
      if (app.state.mode === 'tree' ||
          app.state.mode === '' && window.authenticated && app.state.user) {
        $('#prose').toggleClass('open', true);
        $('#prose').toggleClass('mobile', false);
      } else {
        $('#prose').toggleClass('open mobile', false);
      }

      this.sidebar.setElement(this.$el.find('#drawer')).render();
      this.nav.setElement(this.$el.find('nav')).render();

      return this;
    },

    toggleMobileClass: function(e) {
      $(e.target).toggleClass('active');
      $(this.el).toggleClass('mobile');
      return false;
    },

    documentTitle: function(title) {
      document.title = title + ' · Prose';
    },

    remove: function() {
      _.invoke(this.subviews, 'remove');
      this.subviews = [];

      // Unbind pagehide event handler when View is removed
      this.eventRegister.unbind('documentTitle', this.documentTitle);
      this.eventRegister.unbind('headerContext', this.headerContext);
      this.eventRegister.unbind('recentFiles', this.recentFiles);
      this.eventRegister.unbind('updateSaveState', this.updateSaveState);
      this.eventRegister.unbind('closeSettings', this.closeSettings);
      this.eventRegister.unbind('filenameInput', this.filenameInput);
      Backbone.View.prototype.remove.call(this, arguments);
    }
});
