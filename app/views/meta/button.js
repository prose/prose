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
    this.options = options;
    this.on = options.field.on;
    this.off = options.field.off;
    _.bindAll(this, ['render', 'toggleState', 'getValue', 'setValue']);
  },

  // default value is on, or true.
  render: function() {
    var options = this.options;
    var button = {
      name: options.name,
      label: options.field.label,
      help: options.field.help,
      on: options.field.on,
      off: options.field.off,
      value: options.field.on
    };

    this.setElement($(_.template(this.template, {
      variable: 'meta'
    })(button)));
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
