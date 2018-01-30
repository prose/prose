var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('lodash');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({

  template: templates.meta.text,
  type: 'text',

  initialize: function(options) {
    this.options = options;
    _.bindAll(this, ['render', 'getValue', 'setValue']);
  },

  render: function () {
    var options = this.options;

    var text = {
      name: options.name,
      label: options.field.label,
      help: options.field.help,
      value: options.field.value,
      placeholder: options.field.placeholder,
      type: options.type
    };

    this.setElement($(_.template(this.template, {
      variable: 'meta'
    })(text)));
    this.$form = this.$el.find('input');
    return this.$el;
  },

  getValue: function() {
    return this.options.type === 'number' ?
      Number(this.$form.val()) : this.$form.val();
  },

  setValue: function(value) {
    this.$form.val(value);
  }

});
