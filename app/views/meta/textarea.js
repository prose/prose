var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var templates = require('../../../dist/templates');
var util = require('../../util');

module.exports = Backbone.View.extend({

  template: templates.meta.textarea,

  initialize: function(options) {
    this.id = options.data.id;
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

    return _.template(this.template, textarea, {
      variable: 'meta'
    });
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

    this.listenTo(codeMirror, 'blur', function() {
      textElement.value = codeMirror.getValue();
      onBlur({currentTarget: textElement});
    });

    this.codeMirror = codeMirror;
    return codeMirror;
  },
});
