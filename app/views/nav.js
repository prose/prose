var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('../util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.nav),

  events: {
    'click .edit': 'edit',
    'click .preview': 'preview',
    'click .meta': 'meta',
    'click .settings': 'settings',
    'click a.save': 'save',
    'click .logout': 'logout',
    'click .mobile-menu .toggle': 'toggleMobileClass'
  },

  initialize: function(options) {
    this.app = options.app;
    this.user = options.user;
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
    this.eventRegister.trigger('meta', e);
    return false;
  },

  settings: function(e) {
    var tmpl = _(app.templates.settings).template();
    var $navItems = $('.navigation a', this.el);
    this.cancel();

    if (!$(e.target, this.el).hasClass('active')) {
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
      var placeholder = 'Updated ' + filename;
      if (app.state.mode === 'new') placeholder = 'Created ' + filename;
      $message.attr('placeholder', placeholder).focus();
    }

    return false;
  },

  logout: function() {
    app.models.logout();
    window.location.reload();
    return false;
  },

  render: function() {
    this.$el.html(this.template(_.extend(app.state, {
      noMenu: this.app.noMenu
    })));

    return this;
  },

  mode: function(mode) {
    // Set data-mode attribute to toggle nav buttons in CSS
    this.$el.attr('data-mode', mode);
  }
});
