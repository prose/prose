var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({

  template: templates.meta.multiselect,

  initialize: function(options) {
    this.name = options.data.name;
  },

  // TODO write tests for alterable behavior.
  // TODO write tests for multiselect behavior.
  render: function () {
    var data = this.options.data;
    var multiselect = {
      name: data.name,
      label: data.field.label,
      help: data.field.help,
      alterable: data.field.alterable,
      placeholder: data.field.placeholder,
      options: data.field.options,
      lang: data.lang
    };

    this.setElement($(_.template(this.template, multiselect, {
      variable: 'meta'
    })));
    this.$form = this.$el.find('select');
    return this.$el;
  },

  getValue: function() {
    return this.$form.val();
  }
});
