var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({

  template: templates.meta.select,
  type: 'select',

  initialize: function(options) {
    this.name = options.data.name;
  },

  render: function () {
    var data = this.options.data;
    var select = {
      name: data.name,
      label: data.field.label,
      help: data.field.help,
      placeholder: data.field.placeholder,
      options: data.field.options,
      value: data.field.value,
      lang: data.lang
    };

    this.setElement($(_.template(this.template, select, {
      variable: 'meta'
    })));
    this.$form = this.$el.find('select');
    return this.$el;
  },

  getValue: function() {
    var val = this.$form.val();
    if (!val && val !== 0) {
      return '';
    }
    return val;
  },

  setValue: function(value) {
    var $el = this.$el;
    var $form = this.$form;
    if (_.isArray(value)) {
      value = value[0];
    }
    if (!value && value !== 0) {
      $el.find('option').each(function () {
        $(this).attr('selected', false);
      });
    }
    else {
      var match = $el.find('option[value="' + value + '"]');
      if (match.length) {
        match.attr('selected', 'selected');
        $form.trigger('liszt:updated');
      }
      else {
        $form.append($('<option />', {selected: 'selected', value: value, text: value}));
      }
    }
    $form.trigger('liszt:updated');
  }
});
