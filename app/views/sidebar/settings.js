var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var NavView = require('../nav');
var templates = require('../../../dist/templates');
var utils = require('../../util');

module.exports = Backbone.View.extend({
    template: _.template(templates.sidebar.settings),

    events: {
      'click a.save': 'emit',
      'click a.delete': 'emit',
      'click a.translate': 'emit',
      'click a.draft': 'emit'
    },

    initialize: function(options) {
      this.sidebar = options.sidebar;
      this.config = options.config;
      this.file = options.file;
    },

    emit: function(e) {
      var action = $(e.currentTarget).data('action');
      this.sidebar.trigger(action, e);

      return false;
    },

    render: function() {
      // this.file.get('lang') is programming language
      // this.file.get('metadata').lang is ISO 639-1 language code
      this.$el.html(this.template({
        languages: this.config.languages,
        lang: this.file.get('lang'),
        metadata: this.file.get('metadata')
      }));

      return this;
    }
});