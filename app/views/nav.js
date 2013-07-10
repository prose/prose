var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var config = require('../config');
var utils = require('../util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.nav,

  events: {
    'click a.new': 'emit',
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
    this.user = options.user;
  },

  emit: function(e) {
    var state = $(e.currentTarget).data('state');
    this.toggle(state, e);
    return false;
  },

  logout: function() {
    cookie.unset('oauth-token');
    cookie.unset('id');
    window.location.reload();
    return false;
  },

  mode: function(mode) {
    // Set data-mode attribute to toggle nav buttons in CSS
    this.$el.attr('data-mode', mode);
    this.$el.attr('class', mode);
  },

  active: function(state) {
    this.$el.find('.file a').removeClass('active');
    this.$el.find('.file a[data-state=' + state + ']').toggleClass('active');
  },

  toggle: function(state, e) {
    this.active(state);
    this.trigger(state, e);
  },

  toggleMobileClass: function(e) {
    $(e.target).toggleClass('active');
    this.$el.toggleClass('mobile');
    return false;
  },

  render: function() {
    this.$el.empty().append(_.template(this.template));
    return this;
  }
});
