var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({

  template: templates.meta.multiselect,
  type: 'multiselect',

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
  },

  setValue: function(value) {
    var values = _.isArray(value) ? value : [value];
    var $el = this.$el;
    var $form = this.$form;
    _.each(values, function(v) {
      var match = $el.find('option[value="' + v + '"]');
      if (match.length) {
        match.each(function() {
          this.selected = 'selected';
        });
      }
      // add the value as an option if none exists
      else {
        var $option = $('<option />', {value: v, text: v});
        $option.appendTo($form);
        $option.prop('selected', true);
        $form.trigger('liszt:updated');
      }
    });
  }
});
