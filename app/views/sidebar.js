var _ = require('underscore');
var Backbone = require('backbone');
var util = require('../util');

var views = {
  branches: require('./sidebar/branches'),
  history: require('./sidebar/history'),
  drafts: require('./sidebar/drafts'),
  orgs: require('./sidebar/orgs'),
  save: require('./sidebar/save'),
  settings: require('./sidebar/settings')
};

var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.drawer,

  subviews: {},

  initialize: function(options) {
    _.bindAll(this);
  },

  render: function(options) {
    this.$el.html(_.template(this.template, {}, { variable: 'sidebar' }));
    _.invoke(this.subviews, 'render');
    return this;
  },

  initSubview: function(subview, options) {
    if (!views[subview]) return false;

    options = _.clone(options) || {};

    var view = new views[subview](options);
    this.$el.find('#' + subview).html(view.el);

    this.subviews[subview] = view;

    return view;
  },

  filepathGet: function() {
    return this.$el.find('.filepath').val();
  },

  updateState: function(label) {
    this.$el.find('.button.save').html(label);
  },

  open: function() {
    this.$el.toggleClass('open', true);
  },

  close: function() {
    this.$el.toggleClass('open', false);
  },

  toggle: function() {
    this.$el.toggleClass('open');
  },

  toggleMobile: function() {
    this.$el.toggleClass('mobile');
  },

  mode: function(mode) {
    // Set data-mode attribute to toggle nav buttons in CSS
    this.$el.attr('data-sidebar', mode);
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
