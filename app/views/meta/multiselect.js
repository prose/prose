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
    var val = this.$form.val();
    if (!val && val !== 0) {
      return [];
    }
    return val;
  },

  setValue: function(value) {
    var values = _.isArray(value) ? value : [value];
    values = values.filter(function (value) {
      // make sure we accept values of 0
      return Boolean(value) || value === 0;
    });
    if (!values.length) {
      return;
    }
    var $el = this.$el;
    var $form = this.$form;
    _.each(values, function(v) {
      var match = $el.find('option[value="' + v + '"]');
      if (match.length) {
        match.attr('selected', 'selected');
      }
      // add the value as an option if none exists
      else {
        $form.append($('<option />', {selected: 'selected', value: v, text: v}));
      }
    });
    $form.trigger('liszt:updated');
  }
});
