var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var NavView = require('../nav');
var util = require('../../util');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.sidebar.settings,

  events: {
    'click a.delete': 'emit',
    'click a.translate': 'emit',
    'click a.draft': 'emit',
    'change input.filepath': 'setPath'
  },

  initialize: function(options) {
    this.sidebar = options.sidebar;
    this.config = options.config;
    this.file = options.file;

    // fileInput is passed if a title replaces where it
    // normally is shown in the heading of the file.
    this.fileInput = options.fileInput;

    this.listenTo(this.file, 'change:path', this.updatePath);
  },

  emit: function(e) {
    if (e) e.preventDefault();

    var action = $(e.currentTarget).data('action');
    this.sidebar.trigger(action, e);
  },

  updatePath: function(model, value, options) {
    // Set path value from path attr in file model
    this.$el.find('input.filepath').attr('value', value);
  },

  setPath: function(e) {
    this.file.set('path', e.currentTarget.value);
    this.trigger('makeDirty');
    return false;
  },

  render: function() {
    // this.file.get('lang') is programming language
    // this.file.get('metadata').lang is ISO 639-1 language code
    var settings = {
      languages: this.config ? this.config.languages : [],
      lang: this.file.get('lang'),
      metadata: this.file.get('metadata'),
      fileInput: this.fileInput,
      path: this.file.get('path')
    };

    this.$el.html(_.template(this.template, settings, {
      variable: 'settings'
    }));

    util.autoSelect(this.$el.find('input.filepath'));
    return this;
  }
});
