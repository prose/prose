var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var jsyaml = require('js-yaml');
var templates = require('../../../dist/templates');
var util = require('../../util');

module.exports = Backbone.View.extend({

  template: templates.meta.textarea,
  type: 'textarea',

  initialize: function(options) {
    this.id = options.data.id;
    this.name = options.data.name;
  },

  render: function () {
    var data = this.options.data;

    var textarea = {
      name: data.name,
      id: data.id,
      value: data.field.value,
      label: data.field.label,
      help: data.field.help,
      placeholder: data.field.placeholder,
      type: 'textarea'
    };

    this.setElement($(_.template(this.template, textarea, {
      variable: 'meta'
    })));

    return this.$el;
  },

  // Initialize code mirror and save it to this.
  // Receives onBlur as a callback, which is a hook
  // to update the parent model.
  initCodeMirror: function (onBlur) {
    var id = this.id;
    var name = this.options.data.name;
    var textElement = document.getElementById(id);
    var codeMirror = CodeMirror(function(el) {
      textElement.parentNode.replaceChild(el, textElement);
      el.id = id;
      el.className += ' inner ';
      el.setAttribute('data-name', name);
    }, {
      mode: id,
      value: textElement.value,
      lineWrapping: true,
      theme: 'prose-bright'
    });

    codeMirror.on('blur', function() {
      onBlur({currentTarget: {
        value: codeMirror.getValue()
      }});
    });

    // Since other elements have a $form property shorthand
    // for the form element, make this consistent.
    this.codeMirror = codeMirror;
    this.$form = codeMirror;
    return codeMirror;
  },

  getValue: function() {
    try {
      return jsyaml.safeLoad(this.codeMirror.getValue());
    }
    catch(err) {
      console.log('Error parsing yaml front matter for ', this.name);
      console.log(err);
      return '';
    }
  },

  setValue: function(value) {
    // Only set value if not null or undefined.
    if (value != undefined) {
      this.codeMirror.setValue(_.escape(value));
    }
  }
});
