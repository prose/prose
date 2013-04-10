(function (config, models, views, routers, utils, templates) {

  views.App = Backbone.View.extend({
    id: 'app',

    events: {
      'click .post-views .edit': 'edit',
      'click .post-views .preview': 'preview',
      'click .post-views .settings': 'settings',
      'click a.logout': 'logout',
      'click a.save': 'save',
      'click a.save.confirm': 'updateFile',
      'click a.cancel': 'toggleCommit',
      'click a.delete': 'deleteFile',
      'click a.publish': 'updateMetaData',
      'click a.translate': 'translate'
    },

    initialize: function(options) {
      this.eventRegister = options.eventRegister;

      _.bindAll(this, 'sidebarContext');
      options.eventRegister.bind('sidebarContext', this.sidebarContext);
    },

    render: function () {
      $(this.el).empty().append(templates.app(_.extend(this.model, app.state, {
        state: app.state
      })));

      // When the sidebar should be open.
      if (this.model.mode === 'edit') {
        $('#prose').toggleClass('open', false);

      // Project contents when there aren't branches
      } else if (app.state.mode === 'tree' && !app.state.branches.length) {
        $('#prose').toggleClass('open', false);

      } else {
        $('#prose').toggleClass('open', true);
      }

      _.delay(function () {
        dropdown();
      }, 1);

      return this;
    },

    sidebarContext: function(data, context) {
      if (context === 'post') {
        $('#drawer')
          .empty()
          .html(templates.settings(_.extend(data, app.state, {
            mode: this.mode
        })));
      } else if (context === 'posts') {
        $('#drawer').empty().append(templates.sidebarProject(_.extend(this.model, app.state, {
          currentPath: app.state.path
        })));

        // Branch Switching
        $('.chzn-select').chosen().change(function() {
            router.navigate($(this).val(), false);
        });
      }
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

    settings: function(e) {
      this.eventRegister.trigger('settings', e);
      return false;
    },

    deleteFile: function(e) {
      this.eventRegister.trigger('deleteFile', e);
      return false;
    },

    updateMetaData: function(e) {
      this.eventRegister.trigger('updateMetaData', e);
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

    logout: function () {
      logout();
      app.instance.render();
      if ($('#start').length > 0) {
        app.instance.start();
      } else {
        window.location.reload();
      }
      return false;
    },

    remove: function () {
      // Unbind pagehide event handler when View is removed
      this.options.eventRegister.unbind('sidebarContext', this.sidebarContext);
    }
  });

}).apply(this, window.args);
