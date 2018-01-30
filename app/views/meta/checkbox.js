var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('lodash');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({

  template: templates.meta.checkbox,
  type: 'checkbox',

  initialize: function(options) {
    this.name = options.data.name;
  },

  render: function() {
    var data = this.options.data;
    var checkbox = {
      name: data.name,
      label: data.field.label,
      help: data.field.help,
      value: data.name,
      checked: data.field.value
    };

    this.setElement($(_.template(this.template, checkbox, {
      variable: 'meta'
    })));
    this.$form = this.$el.find('input');
    return this.$el;
  },

  getValue: function() {
    return this.$form[0].checked;
  },

  setValue: function(value) {
    this.$form[0].checked = value;
  },
});
