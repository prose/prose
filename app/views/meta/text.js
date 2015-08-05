var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({

  template: templates.meta.text,

  render: function () {
    var data = this.options.data;

    var text = {
      name: data.name,
      label: data.field.label,
      help: data.field.help,
      value: data.field.value,
      placeholder: data.field.placeholder,
      type: data.type
    };

    return _.template(this.template, text, {
      variable: 'meta'
    });
  }
});
