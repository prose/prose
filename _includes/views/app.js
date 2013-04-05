(function (config, models, views, routers, utils, templates) {

  views.App = Backbone.View.extend({
    id: 'app',

    events: {
      'click .post-views a': 'postViews',
      'click a.logout': 'logout',
      'click a.save': 'save',
      'click a.delete': 'deleteFile',
      'click a.publish': 'updateMetaData'
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
      } else {
        $('#prose').toggleClass('open', true);
      }

      _.delay(function () {
        dropdown();
      }, 1);

      return this;
    },

    sidebarContext: function(data) {

      // Right now this is just triggered on the
      // post view. TODO possibly set this up with
      // a parameter to pass in view context to handle
      // other scenarios.
      $('#drawer')
        .empty()
        .html(templates.settings(_.extend(data, app.state, {
          mode: this.mode
      })));
    },

    // Event Triggering to other files
    deleteFile: function(e) {
      this.eventRegister.trigger('deleteFile', e);
      return false;
    },

    updateMetaData: function(e) {
      this.eventRegister.trigger('updateMetaData', e);
      return false;
    },

    postViews: function(e) {
      this.eventRegister.trigger('postViews', e);
      return false;
    },

    save: function(e) {
      this.eventRegister.trigger('save', e);

      // Trigger commit message stuff
      this.$('.commit-message').attr('placeholder', "Updated " + $('input.filepath').val());

      this.$('.button.save').html(this.$('.document-menu').hasClass('commit') ? (this.model.writeable ? 'SAVE' : 'SUBMIT CHANGE') : 'COMMIT');
      this.$('.button.save').toggleClass('confirm');
      this.$('.commit-message').focus();

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
    }
  });

}).apply(this, window.args);
