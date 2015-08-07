var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({

  template: templates.meta.button,
  type: 'button',

  initialize: function(options) {
    this.name = options.data.name;
  },

  render: function() {
    var data = this.options.data;
    var button = {
      name: data.name,
      label: data.field.label,
      help: data.field.help,
      on: data.field.on,
      off: data.field.off
    };

    this.setElement($(_.template(this.template, button, {
      variable: 'meta'
    })));
    this.$form = this.$el.find('button');
    return this.$el;
  },

  getValue: function() {
    return this.$form.val() === 'true';
  },

  setValue: function(value) {
    this.val(value);
  }
});
