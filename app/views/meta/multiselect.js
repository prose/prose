var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('lodash');
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

    if (Array.isArray(data.field.value)) {
      multiselect.value = data.field.value;
    } else if (typeof data.field.value !== 'undefined' && typeof data.field.value !== 'object') {
      multiselect.value = [data.field.value];
    } else {
      multiselect.value = [];
    }

    this.setElement($(_.template(this.template, {
      variable: 'meta'
    })(multiselect)));
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
    var values = _.isArray(value) ? value : [value];
    values = values.filter(function (value) {
      // make sure we accept values of 0
      return Boolean(value) || value === 0;
    });
    if (!values.length) {
      $el.find('option').each(function () {
        $(this).attr('selected', false);
      });
    }
    else {
      values.forEach(function(v) {
        var match = $el.find('option[value="' + v + '"]');
        if (match.length) {
          match.attr('selected', 'selected');
        }
        // add the value as an option if none exists
        else {
          $form.append($('<option />', {selected: 'selected', value: v, text: v}));
        }
      });
    }
    $form.trigger('liszt:updated');
  }
});
