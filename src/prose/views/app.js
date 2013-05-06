var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('.././util');

module.exports = Backbone.View.extend({
    className: 'application',

    events: {
      'click .post-views .edit': 'edit',
      'click .post-views .preview': 'preview',
      'click .post-views .settings': 'settings',
      'click .post-views .meta': 'meta',
      'click a.logout': 'logout',
      'click a.save': 'save',
      'click a.save.confirm': 'updateFile',
      'click a.save-action': 'updateFile',
      'click a.cancel': 'cancelSave',
      'click a.delete': 'deleteFile',
      'click a.translate': 'translate',
      'keypress input.filepath': 'saveFilePath'
    },

    initialize: function(options) {

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

      _.bindAll(this, 'documentTitle', 'headerContext', 'sidebarContext', 'recentFiles', 'updateSave', 'updateSaveState');
      this.eventRegister.bind('documentTitle', this.documentTitle);
      this.eventRegister.bind('headerContext', this.headerContext);
      this.eventRegister.bind('sidebarContext', this.sidebarContext);
      this.eventRegister.bind('recentFiles', this.recentFiles);
      this.eventRegister.bind('updateSave', this.updateSave);
      this.eventRegister.bind('updateSaveState', this.updateSaveState);
    },

    render: function(options) {
      var tmpl = _(window.app.templates.app).template();
      var isJekyll = false;
      var errorPage = false;
      if (options && options.jekyll) isJekyll = options.jekyll;
      if (options && options.error) errorPage = options.error;

      $(this.el).empty().append(tmpl(_.extend(this.model, app.state, {
        jekyll: isJekyll,
        error: errorPage
      })));

      // When the sidebar should be open.
      // Fix this in re-factor, could be much tighter
      if (app.state.mode === 'tree') {
        $('#prose').toggleClass('open', true);
      } else if (app.state.mode === '' && window.authenticated && app.state.user !== '') {
        $('#prose').toggleClass('open', true);
      } else {
        $('#prose').toggleClass('open', false);
      }

      return this;
    },

    documentTitle: function(title) {
      document.title = title + ' · Prose';
    },

    headerContext: function(data) {
      var heading = _(window.app.templates.heading).template();
      $('#heading').empty().append(heading(data));
    },

    sidebarContext: function(data, context) {
      var sidebarTmpl;

      if (context === 'post') {
        sidebarTmpl = _(app.templates.settings).template();
      } else if (context === 'posts') {
        sidebarTmpl = _(app.templates.sidebarProject).template();
      }

      $('#drawer', this.el)
        .empty()
        .append(sidebarTmpl(data));

      // Branch Switching
      $('.chzn-select').chosen().change(function() {
          router.navigate($(this).val(), true);
      });
    },

    recentFiles: function(data) {
      var sidebarTmpl = _(window.app.templates.recentFiles).template();
      $('#drawer', this.el).empty().append(sidebarTmpl(data));
    },

    // Event Triggering to other files
    edit: function(e) {
      this.viewing = 'edit';
      this.eventRegister.trigger('edit', e);
      return false;
    },

    preview: function(e) {
      if ($(e.target).data('jekyll')) {
        this.eventRegister.trigger('preview', e);
      } else {
        this.viewing = 'preview';
        this.eventRegister.trigger('preview', e);
        // Cancel propagation
        return false;
      }
    },

    // Event Triggering to other files
    meta: function(e) {
      this.viewing = 'meta';
      this.eventRegister.trigger('meta', e);
      return false;
    },

    settings: function(e) {
      $navItems = $('.navigation a', this.el);

      if ($(e.target, this.el).hasClass('active')) {
        $navItems.removeClass('active');
        $('.navigation .' + this.viewing, this.el).addClass('active');
      } else {
        $navItems.removeClass('active');
        $(e.target, this.el).addClass('active');
      }

      $('#prose').toggleClass('open');
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

    save: function(e) {
      this.eventRegister.trigger('save', e);
      this.toggleCommit();
      return false;
    },

    cancelSave: function(e) {
      this.eventRegister.trigger('hideDiff', e);
      this.toggleCommit();
      return false;
    },

    toggleCommit: function() {
      $('.commit', this.el).toggleClass('active');
      $('.button.save', this.el).toggleClass('confirm');

      // TODO Fix this this.model.writable should work as a boolean
      $('.button.save', this.el).html($('.button.save', this.el).hasClass('confirm') ? 'Commit' : (this.model.writeable ? 'Save' : 'Save'));
      $('.commit-message', this.el).focus();
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

    logout: function () {
      window.app.models.logout();
      if ($('#start').length > 0) {
        router.navigate('/', true);
      } else {
        window.location.reload();
      }
      return false;
    },

    updateSave: function(saveState) {
      if (!$('.button.save', this.el).hasClass('saving')) {
        $('.button.save', this.el)
          .html(saveState)
          .removeClass('error');

        // Pass a popover span to the avatar icon
        $('#heading', this.el).find('.popup').html('Ctrl&nbsp;+&nbsp;S');

        $('#prose')
          .removeClass('error saving saved save')
          .addClass('save');
      }
    },

    updateSaveState: function(label, classes) {
      $('.button.save', this.el).html(label);

      // Pass a popover span to the avatar icon
      $('#heading', this.el).find('.popup').html(label);
      $('.save-action').find('.popup').html(label);

      $('#prose')
        .removeClass('error saving saved save')
        .addClass(classes);
    },

    remove: function() {
      // Unbind pagehide event handler when View is removed
      this.eventRegister.unbind('documentTitle', this.documentTitle);
      this.eventRegister.unbind('sidebarContext', this.sidebarContext);
      this.eventRegister.unbind('headerContext', this.headerContext);
      this.eventRegister.unbind('recentFiles', this.recentFiles);
      this.eventRegister.unbind('updateSave', this.updateSave);
      this.eventRegister.unbind('updateSaveState', this.updateSaveState);
      Backbone.View.prototype.remove.call(this);
    }
});
