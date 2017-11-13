var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var upload = require('../../upload');
var templates = require('../../../dist/templates');
var util = require('../../util');

module.exports = Backbone.View.extend({

  template: templates.meta.image,
  type: 'image',

  initialize: function(options) {
    this.name = options.data.name;
  },

  // TODO write tests for upload behavior.
  // TODO write tests for url behavior.
  render: function () {
    var data = this.options.data;
    var image = {
      name: data.name,
      label: data.field.label,
      help: data.field.help,
      value: data.field.value,
      placeholder: data.field.placeholder,
    };

    this.setElement($(_.template(this.template, image, {
      variable: 'meta'
    })));
    this.$form = this.$el.find('input');
    return this.$el;
  },

  getValue: function() {
    return this.$form.val();
  },

  setValue: function(value) {
    this.$form.val(value);
  }
});
