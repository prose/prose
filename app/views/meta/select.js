var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('lodash');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({

  template: templates.meta.select,
  type: 'select',

  initialize: function(options) {
    this.options = options;
    _.bindAll(this, ['render', 'getValue', 'setValue']);
  },

  render: function () {
    var options = this.options;
    var select = {
      name: options.name,
      label: options.field.label,
      help: options.field.help,
      placeholder: options.field.placeholder,
      options: options.field.options,
      value: options.field.value,
      lang: options.lang
    };

    this.setElement($(_.template(this.template, {
      variable: 'meta'
    })(select)));
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
