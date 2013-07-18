var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var NavView = require('../nav');
var templates = require('../../../dist/templates');
var utils = require('../../util');

module.exports = Backbone.View.extend({
  template: templates.sidebar.settings,

  events: {
    'click a.save': 'emit',
    'click a.delete': 'emit',
    'click a.translate': 'emit',
    'click a.draft': 'emit',
    'change input.filepath': 'saveFilePath'
  },

  saveFilePath: function(e) {
    this.file.set('path', e.currentTarget.value);
    this.trigger('makeDirty');
    return false;
  },

  initialize: function(options) {
    this.sidebar = options.sidebar;
    this.config = options.config;
    this.file = options.file;

    // fileInput is passed if a title replaces where it
    // normally is shown in the heading of the file.
    this.fileInput = options.fileInput;
  },

  emit: function(e) {
    if (e) e.preventDefault();

    var action = $(e.currentTarget).data('action');
    this.sidebar.trigger(action);
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

    this.$el.empty().append(_.template(this.template, settings, {
      variable: 'settings'
    }));

    utils.autoSelect(this.$el.find('input.filepath'));
    return this;
  }
});
