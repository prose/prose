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
    var state = $(e.currentTarget).data('state');

    this.toggle(state, e);

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
    this.$el.attr('class', mode);
  },

  toggle: function(state, e) {
    this.$el.find('.file a').not('[data-state=' + state + ']').removeClass('active');
    this.$el.find('.file a[data-state=' + state + ']').toggleClass('active');

    this.trigger(state, e);
  },

  render: function() {
    this.$el.html(this.template(_.extend(app.state, {
      noMenu: this.app.noMenu
    })));

    return this;
  }
});
