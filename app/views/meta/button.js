var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('lodash');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({

  template: templates.meta.button,
  type: 'button',
  events: {
    'click button': 'toggleState'
  },

  initialize: function(options) {
    this.name = options.data.name;
    this.on = options.data.field.on;
    this.off = options.data.field.off;
  },

  // default value is on, or true.
  render: function() {
    var data = this.options.data;
    var button = {
      name: data.name,
      label: data.field.label,
      help: data.field.help,
      on: data.field.on,
      off: data.field.off,
      value: data.field.on
    };

    this.setElement($(_.template(this.template, button, {
      variable: 'meta'
    })));
    this.$form = this.$el.find('button');
    return this.$el;
  },

  toggleState: function() {
    var val = this.$form.val() === this.on ?
      this.off : this.on;
    this.$form.val(val).text(val);
  },

  getValue: function() {
    return this.$form.val() === this.on;
  },

  // Sets value to false if user gives anything except
  // the string equivalent of on.
  setValue: function(value) {
    this.$form.val(value === this.on);
  }
});
