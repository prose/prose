var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('../util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.nav),

  events: {
    'click a.edit': 'emit',
    'click a.preview': 'emit',
    'click a.meta': 'emit',
    'click a.settings': 'emit',
    'click a.save': 'emit',
    'click a.logout': 'logout',
    'click .mobile-menu .toggle': 'toggleMobileClass'
  },

  initialize: function(options) {
    this.app = options.app;
    this.user = options.user;
  },

  emit: function(e) {
    var target = $(e.target);
    var state = target.data('state');

    this.active(state);
    this.trigger(state, e);

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

  logout: function() {
    app.models.logout();
    window.location.reload();
    return false;
  },

  mode: function(mode) {
    // Set data-mode attribute to toggle nav buttons in CSS
    this.$el.attr('data-mode', mode);
  },

  active: function(state) {
    this.$el.find('.post-views a').removeClass('active');
    this.$el.find('.post-views a[data-state=' + state + ']').addClass('active');
  },

  render: function() {
    this.$el.html(this.template(_.extend(app.state, {
      noMenu: this.app.noMenu
    })));

    return this;
  }
});
