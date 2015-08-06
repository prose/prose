var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({

  events: {
    'change .metafield': 'updateValue'
  },

  template: templates.meta.checkbox,

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

  updateValue: function() {
    this.$form.val(this.$form[0].checked ? true : false);
  },

  getValue: function() {
    return this.$form[0].checked;
  }
});
