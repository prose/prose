var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({

  template: templates.meta.select,

  render: function () {
    var data = this.options.data;
    var select = {
      name: data.name,
      label: data.field.label,
      help: data.field.help,
      placeholder: data.field.placeholder,
      options: data.field.options,
      lang: data.lang
    };

    return _.template(this.template, select, {
      variable: 'meta'
    });
  }
});
