var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({

  template: templates.meta.checkbox,

  render: function () {
    var data = this.options.data;
    var checkbox = {
      name: data.name,
      label: data.field.label,
      help: data.field.help,
      value: data.name,
      checked: data.field.value
    };

    return _.template(this.template, checkbox, {
      variable: 'meta'
    });
  }
});
