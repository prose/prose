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

    events: {
      'click a.save': 'save',
      'click a.cancel': 'cancel',
      'click a.confirm': 'updateFile',
      'click a.delete': 'deleteFile',
      'click a.translate': 'translate',
      'click a.draft': 'draft',
      'focus input.filepath': 'checkPlaceholder',
      'keypress input.filepath': 'saveFilePath'
    },

    initialize: function(options) {
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

      _.bindAll(this, 'documentTitle', 'headerContext', 'sidebarContext', 'recentFiles', 'updateSaveState', 'closeSettings', 'filenameInput', 'renderNav');
      this.eventRegister.bind('documentTitle', this.documentTitle);
      this.eventRegister.bind('headerContext', this.headerContext);
      this.eventRegister.bind('recentFiles', this.recentFiles);
      this.eventRegister.bind('updateSaveState', this.updateSaveState);
      this.eventRegister.bind('filenameInput', this.filenameInput);
      this.eventRegister.bind('closeSettings', this.closeSettings);
      this.eventRegister.bind('renderNav', this.renderNav);
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

      // Render the vertical Navigation
      this.renderNav();

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

    renderNav: function() {
      var tmpl = _(app.templates.verticalNav).template();
      this.$el.find('#vert').empty().append(tmpl(this.data));
    },

    toggleMobileClass: function(e) {
      $(e.target).toggleClass('active');
      $(this.el).toggleClass('mobile');
      return false;
    },

    documentTitle: function(title) {
      document.title = title + ' · Prose';
    },

    headerContext: function(data, alterable) {
      var heading = _(window.app.templates.heading).template();

      if (data.writable) this.writable = true;
      if (data.lang) this.lang = data.lang;
      if (data.metadata) this.metadata = data.metadata;

      $('#heading').empty().append(heading(_.extend(data, {
        alterable: alterable ? true : false
      })));
    },

    filenameInput: function() {
      $('.filepath', this.el).focus();
    },

    recentFiles: function(data) {
      var sidebarTmpl = _.template(window.app.templates.recentFiles);
      $('#drawer', this.el).empty().append(sidebarTmpl(data));
    },

    // Event Triggering to other files
    edit: function(e) {
      this.eventRegister.trigger('edit', e);
      return false;
    },

    preview: function(e) {
      if ($(e.target).data('jekyll')) {
        this.eventRegister.trigger('preview', e);
      } else {
        this.eventRegister.trigger('preview', e);
        // Cancel propagation
        return false;
      }
    },

    // Event Triggering to other files
    meta: function(e) {
      if ($(e.target).hasClass('active')) {
        this.cancel();
      } else {
        this.eventRegister.trigger('meta', e);
      }

      return false;
    },

    settings: function(e) {
      var tmpl = _(app.templates.settings).template();
      var $navItems = $('.navigation a', this.el);

      if ($(e.target).hasClass('active')) {
        this.cancel();
      } else {
        $navItems.removeClass('active');
        $(e.target, this.el).addClass('active');

        $('#drawer', this.el)
          .empty()
          .append(tmpl({
            lang: this.lang,
            writable: this.writable,
            metadata: this.metadata,
            jekyll: this.model.jekyll,
            draft: (app.state.path.split('/')[0] === '_drafts') ? true : false
          }));

        $('#prose').toggleClass('open mobile', true);
      }

      return false;
    },

    closeSettings: function() {
      $('.post-views a', this.el).removeClass('active');

      if (app.state.mode === 'blob') {
        $('.post-views .preview', this.el).addClass('active');
      } else {
        $('.post-views .edit', this.el).addClass('active');
      }

      $('#prose').toggleClass('open mobile', false);
    },

    restoreFile: function(e) {
      var $target = $(e.currentTarget);
      var $overlay = $(e.currentTarget).find('.overlay');
      var path = $target.data('path');

      // Spinning icon
      var message = '<span class="ico small inline saving"></span>' + t('actions.restore.restoring') + path;
      $overlay.html(message);

      app.models.restoreFile(app.state.user, app.state.repo, app.state.branch, path, app.state.history.commits[path][0].url, function(err) {
        if (err) {
          message = '<span class="ico small inline error"></span> ' + t('actions.error');
          $overlay.html(message);
        } else {
          message = '<span class="ico small inline checkmark"></span> ' + t('actions.restore.restored') + path;
          $overlay.html(message);
          $overlay.removeClass('removed').addClass('restored');

          // Update the listing anchor link
          $target
            .removeClass('removed')
            .attr('title', 'Restored ' + path)
            .addClass('added');

          // Update the anchor listing icon
          $target.find('.removed')
            .removeClass('removed')
            .addClass('added');
        }
      });

      return false;
    },

    deleteFile: function(e) {
      this.eventRegister.trigger('deleteFile', e);
      return false;
    },

    translate: function(e) {
      this.eventRegister.trigger('translate', e);
      return false;
    },
    
    draft: function(e) {
      this.eventRegister.trigger('draft', e);
      return false;
    },

    save: function(e) {
      var tmpl = _(app.templates.sidebarSave).template();
      this.eventRegister.trigger('showDiff', e);

      if ($(e.target, this.el).hasClass('active')) {
        this.cancel();
      } else {
        $('.navigation a', this.el).removeClass('active');
        $(e.target, this.el).addClass('active');

        $('#drawer', this.el)
          .empty()
          .append(tmpl({
            writable: this.writable
        }));

        $('#prose').toggleClass('open mobile', true);

        var $message = $('.commit-message', this.el);
        var filepath = $('input.filepath').val();
        var filename = _.extractFilename(filepath)[1];
        var placeholder = t('actions.commits.updated', { filename: filename });
        if (app.state.mode === 'new') {
          placeholder = t('actions.commits.created', { filename: filename });
        }

        $message.attr('placeholder', placeholder).focus();
      }

      return false;
    },

    cancel: function(e) {
      $('.navigation a', this.el).removeClass('active');
      $('.navigation .' + app.state.mode, this.el).addClass('active');
      $('#prose').toggleClass('open mobile', false);
      this.eventRegister.trigger('cancel', e);
      return false;
    },

    updateFile: function(e) {
      this.eventRegister.trigger('updateFile', e);
      return false;
    },

    saveFilePath: function(e) {
      // Trigger updateFile when a return button has been pressed.
      if (e.which === 13) this.eventRegister.trigger('updateFile', e);
    },

    checkPlaceholder: function(e) {
      if (app.state.mode === 'new') {
        var $target = $(e.target, this.el);
        if (!$target.val()) {
          $target.val($target.attr('placeholder'));
        }
      }
    },

    updateSaveState: function(label, classes, kill) {
      var view = this;

      // Cancel if this condition is met
      if (classes === 'save' && $(this.el).hasClass('saving')) return;
      $('.button.save', this.el).html(label);

      // Pass a popover span to the avatar icon
      $('#heading', this.el).find('.popup').html(label);
      $('.action').find('.popup').html(label);

      $(this.el)
        .removeClass('error saving saved save')
        .addClass(classes);

      if (kill) {
        _.delay(function() {
          $(view.el).removeClass(classes);
        }, 1000);
      }
    },

    remove: function() {
      _.invoke(this.subviews, 'remove');
      this.subviews = [];

      // Unbind pagehide event handler when View is removed
      this.eventRegister.unbind('documentTitle', this.documentTitle);
      this.eventRegister.unbind('headerContext', this.headerContext);
      this.eventRegister.unbind('recentFiles', this.recentFiles);
      this.eventRegister.unbind('updateSaveState', this.updateSaveState);
      this.eventRegister.unbind('filenameInput', this.filenameInput);
      this.eventRegister.unbind('closeSettings', this.closeSettings);
      this.eventRegister.unbind('renderNav', this.renderNav);
      Backbone.View.prototype.remove.call(this, arguments);
    }
});
