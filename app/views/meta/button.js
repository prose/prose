var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({

  template: templates.meta.button,

  render: function () {
    var data = this.options.data;
    var button = {
      name: data.name,
      label: data.field.label,
      help: data.field.help,
      on: data.field.on,
      off: data.field.off
    };

    return _.template(this.template, button, {
      variable: 'meta'
    });
  }
});
