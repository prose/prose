var _ = require('underscore');
var Backbone = require('backbone');
var util = require('../util');

var views = {
  branches: require('./sidebar/branches'),
  history: require('./sidebar/history'),
  orgs: require('./sidebar/orgs'),
  save: require('./sidebar/save'),
  settings: require('./sidebar/settings')
};

var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.drawer),

  subviews: [],

  initialize: function(options) {
    _.bindAll(this);
  },

  initSubview: function(subview, options) {
    if (!views[subview]) return false;

    options = _.clone(options) || {};

    this[subview] = new views[subview](options);
    this[subview].setElement(this.$el.find('#' + subview));

    this.subviews.push(this[subview]);

    // TODO: this.subviews is being filled with abandoned views preventing garbage collection
    // refactor references to subviews by setting Object values
    // this.subviews[subview] = this[subview];
    this.renderSubview(subview);
  },

  renderSubview: function(subview) {
    this[subview].render();
  },

  render: function(options) {
    this.$el.html(this.template());
    _.invoke(this.subviews, 'render');
    return this;
  },

  filepathGet: function() {
    return this.$el.find('.filepath').val();
  },

  updateFilepath: function(name) {
    var path = this.$el.find('.filepath').val();
    var parts = path.split('/');
    var old = parts.pop();

    // preserve the date and the extension
    var date = util.extractDate(old);
    var extension = old.split('.').pop();

    var newPath = parts.join('/') + date + '-' + util.stringToUrl(name) + '.' + extension;

    this.$el.find('.filepath').attr('value', newPath);
  },

  updateState: function(label) {
    this.$el.find('.button.save').html(label);
  },

  open: function() {
    this.$el.toggleClass('open mobile', true);

    // TODO: call when in 'tree'/repo mode and when authenticated but no mode (profile)?
    // this.$el.toggleClass('open', true);
    // this.$el.toggleClass('mobile', false);
  },

  close: function() {
    this.$el.toggleClass('open mobile', false);
  },

  toggle: function() {
    this.$el.toggleClass('open mobile');
  },

  mode: function(mode) {
    // Set data-mode attribute to toggle nav buttons in CSS
    this.$el.attr('data-mode', mode);
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = [];

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
