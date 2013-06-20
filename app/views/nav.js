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
    this.sidebar = options.sidebar;
  },

  emit: function(e) {
    var target = $(e.target);
    var state = target.data('state');

    this.active(state, e);

    return false;
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

  active: function(state, e) {
    this.$el.find('.post-views a').not('[data-state=' + state + ']').removeClass('active');
    this.$el.find('.post-views a[data-state=' + state + ']').addClass('active');

    this.trigger(state, e);
  },

  toggle: function(state, e) {
    var target = this.$el.find('.post-views a[data-state=' + state + ']');

    this.$el.find('.post-views a:not[data-state=' + state + ']').removeClass('active');
    target.toggleClass('active');

    if (target.hasClass('active')) {
      this.trigger(state, e);
    } else {
      if (this.mode === 'blob') {
        $('.post-views .preview', this.el).addClass('active');
      } else {
        $('.post-views .edit', this.el).addClass('active');
      }
    }
  },

  render: function() {
    this.$el.html(this.template(_.extend(app.state, {
      noMenu: this.app.noMenu
    })));

    return this;
  }
});
