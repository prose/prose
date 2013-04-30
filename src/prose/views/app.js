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
      'click a.cancel': 'cancelSave',
      'click a.delete': 'deleteFile',
      'click a.translate': 'translate',
      'keypress input.filepath': 'saveFilePath'
    },

    initialize: function(options) {

      app.state = {
        user: '',
        repo: '',
        mode: '',
        branch: '',
        path: ''
      };

      this.eventRegister = app.eventRegister;

      _.bindAll(this, 'headerContext', 'sidebarContext', 'recentFiles', 'updateSave', 'updateSaveState');
      this.eventRegister.bind('headerContext', this.headerContext);
      this.eventRegister.bind('sidebarContext', this.sidebarContext);
      this.eventRegister.bind('recentFiles', this.recentFiles);
      this.eventRegister.bind('updateSave', this.updateSave);
      this.eventRegister.bind('updateSaveState', this.updateSaveState);
    },

    render: function(options) {
      var tmpl = _(window.app.templates.app).template();
      var isJekyll = false;
      if (options && options.jekyll) isJekyll = options.jekyll;

      $(this.el).empty().append(tmpl(_.extend(this.model, app.state, {
        jekyll: isJekyll
      })));

      // When the sidebar should be open.
      // Fix this in re-factor, could be much tighter
      if (this.model.mode === 'edit' || this.model.mode === 'preview' || this.model.mode === 'new') {
        $('#prose').toggleClass('open', false);
        this.viewing = 'edit';
      } else if (!window.authenticated) {
        $('#prose').toggleClass('open', false);
      } else {
        $('#prose').toggleClass('open', true);
      }

      return this;
    },

    headerContext: function(data) {
      var heading = _(window.app.templates.heading).template();
      $('#heading').empty().append(heading(data));
    },

    sidebarContext: function(data, context) {
      var sidebarTmpl;

      if (context === 'post') {
        sidebarTmpl = _(window.app.templates.settings).template();
      } else if (context === 'posts') {
        sidebarTmpl = _(window.app.templates.sidebarProject).template();
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
        app.router.navigate('/', true);
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

        $('#prose')
          .removeClass('error, saving, saved')
          .addClass('save');
      }
    },

    updateSaveState: function(label, classes) {
      $('.button.save', this.el).html(label);
      $('#prose')
        .removeClass('error, saving, saved')
        .addClass(classes);
    },

    remove: function() {
      // Unbind pagehide event handler when View is removed
      this.eventRegister.unbind('sidebarContext', this.sidebarContext);
      this.eventRegister.unbind('headerContext', this.headerContext);
      this.eventRegister.unbind('recentFiles', this.recentFiles);
      this.eventRegister.unbind('updateSave', this.updateSave);
      this.eventRegister.unbind('updateSaveState', this.updateSaveState);
    }
});
