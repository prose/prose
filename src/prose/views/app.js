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
      'click .auth .logout': 'logout',
      'click a.item.removed': 'restoreFile',
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

      _.bindAll(this, 'documentTitle', 'headerContext', 'sidebarContext', 'recentFiles', 'updateSaveState', 'filenameInput');
      this.eventRegister.bind('documentTitle', this.documentTitle);
      this.eventRegister.bind('headerContext', this.headerContext);
      this.eventRegister.bind('sidebarContext', this.sidebarContext);
      this.eventRegister.bind('recentFiles', this.recentFiles);
      this.eventRegister.bind('updateSaveState', this.updateSaveState);
      this.eventRegister.bind('filenameInput', this.filenameInput);
    },

    render: function(options) {
      var tmpl = _(window.app.templates.app).template();
      var isJekyll = false;
      var errorPage = false;
      if (options && options.jekyll) isJekyll = options.jekyll;
      if (options && options.error) errorPage = options.error;

      $(this.el).empty().append(tmpl(_.extend(this.model, app.state, {
        jekyll: isJekyll,
        error: errorPage,
        lang: (app.state.file) ? _.mode(app.state.file) : undefined
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

    filenameInput: function() {
      $('.filepath', this.el).focus();
    },

    sidebarContext: function(data) {
      var sidebarTmpl;

      if (app.state.mode === 'tree') {
        sidebarTmpl = _(app.templates.sidebarProject).template();
      } else if (data.file) {
        this.writeable = data.writeable;
        sidebarTmpl = _(app.templates.settings).template();
      }

      $('#drawer', this.el)
        .empty()
        .append(sidebarTmpl(data));

      if (data.permalink) utils.autoSelect($('.permalink'));

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
      if (!this.viewing) this.viewing = app.state.mode;

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

    restoreFile: function(e) {
      var $target = $(e.currentTarget);
      var $overlay = $(e.currentTarget).find('.overlay');
      var path = $target.data('path');

      // Spinning icon
      var message = '<span class="ico small inline saving"></span> Restoring ' + path;
      $overlay.html(message);

      app.models.restoreFile(app.state.user, app.state.repo, app.state.branch, path, app.state.history.commits[path][0].url, function(err) {
        if (err) {
          message = '<span class="ico small inline error"></span> Error Try again in 30 Seconds';
          $overlay.html(message);
        } else {
          message = '<span class="ico small inline checkmark"></span> Restored ' + path;
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

      $('.button.save', this.el)
        .html($('.button.save', this.el)
        .hasClass('confirm') ?
          (this.writeable ? 'Commit' : 'Send Change Request') :
          (this.writeable ? 'Save' : 'Submit Change'));

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

    logout: function() {
      app.models.logout();
      window.location.reload();
      return false;
    },

    updateSaveState: function(label, classes, kill) {
      var view = this;

      // Cancel if this condition is met
      if (classes === 'save' && $(this.el).hasClass('saving')) return;
      $('.button.save', this.el).html(label);

      // Pass a popover span to the avatar icon
      $('#heading', this.el).find('.popup').html(label);
      $('.save-action').find('.popup').html(label);

      $(this.el)
        .removeClass('error saving saved save')
        .addClass(classes);

      if (kill) {
        _.delay(function() {
          $(view.el).removeClass(classes);
        }, 2000);
      }
    },

    remove: function() {
      // Unbind pagehide event handler when View is removed
      this.eventRegister.unbind('documentTitle', this.documentTitle);
      this.eventRegister.unbind('sidebarContext', this.sidebarContext);
      this.eventRegister.unbind('headerContext', this.headerContext);
      this.eventRegister.unbind('recentFiles', this.recentFiles);
      this.eventRegister.unbind('updateSaveState', this.updateSaveState);
      this.eventRegister.unbind('filenameInput', this.filenameInput);
      Backbone.View.prototype.remove.call(this);
    }
});
