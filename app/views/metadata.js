var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.metadata),

  initialize: function(options) {
    this.model = options.model;
    this.listenTo(this.model, 'sync', this.render, this);
  },

  render: function() {
    this.$el.html(this.template({}));

    var form = this.$el.find('.form');
    var tmpl;

    return this;


    // TODO: prefetch _config.yml content
    /*
    var config = view.model.collection.findWhere({ path: '_prose.yml' }) ||
      view.model.collection.findWhere({ path: '_config.yml' });
    */

    _(model.default_metadata).each(function(data, key) {
      if (data && typeof data.field === 'object') {
        switch (data.field.element) {
          case 'button':
            tmpl = _.template(templates.metadata.button);
            form.append(tmpl({
              name: data.name,
              label: data.field.label,
              value: data.field.value,
              on: data.field.on,
              off: data.field.off
            }));
            break;
          case 'checkbox':
            tmpl = _.template(templates.metadata.checkbox);
            form.append(tmpl({
              name: data.name,
              label: data.field.label,
              value: data.name,
              checked: data.field.value
            }));
            break;
          case 'text':
            tmpl = _.template(templates.metadata.text);
            form.append(tmpl({
              name: data.name,
              label: data.field.label,
              value: data.field.value,
              type: 'text'
            }));
            break;
          case 'number':
            tmpl = _.template(templates.metadata.text);
            form.append(tmpl({
              name: data.name,
              label: data.field.label,
              value: data.field.value,
              type: 'number'
            }));
            break;
          case 'select':
            tmpl = _.template(templates.metadata.select);
            form.append(tmpl({
              name: data.name,
              label: data.field.label,
              placeholder: data.field.placeholder,
              options: data.field.options,
              lang: model.metadata.lang || 'en'
            }));
            break;
          case 'multiselect':
            tmpl = _.template(templates.metadata.multiselect);
            form.append(tmpl({
              name: data.name,
              label: data.field.label,
              placeholder: data.field.placeholder,
              options: data.field.options,
              lang: model.metadata.lang || 'en'
            }));
            break;
          case 'hidden':
            tmpl = {};
            tmpl[data.name] = data.field.value;
            this.model.set('metadata', _.merge(tmpl, this.model.get('metadata')));
            break;
        }
      } else {
        tmpl = _(window.app.templates.text).template();
        form.append(tmpl({
          name: key,
          label: key,
          value: data,
          type: 'text'
        }));
      }
    });

    $('<div class="form-item"><div name="raw" id="raw" class="inner"></div></div>').prepend('<label for="raw">Raw Metadata</label>').appendTo(form);

    var rawContainer = (view.model.lang === 'yaml') ? 'code' : 'raw';
    this.rawEditor = CodeMirror(document.getElementById(rawContainer), {
      mode: 'yaml',
      value: '',
      lineWrapping: true,
      extraKeys: view.keyMap(),
      theme: 'prose-bright'
    });

    view.listenTo(this.rawEditor, 'change', view.makeDirty, view);

    setValue(model.metadata);
    $('.chzn-select').chosen();
    
    return this;
  },

  getValue: function() {
    var metadata = {};

    if ($('.publish-flag').attr('data-state') === 'true') {
      metadata.published = true;
    } else {
      metadata.published = false;
    }

    _.each(this.$el.find('[name]'), function(item) {
      var $item = $(item);
      var value = $item.val();

      switch (item.type) {
        case 'select-multiple':
        case 'select-one':
        case 'text':
          if (value) {
            value = $item.data('type') === 'number' ? Number(value) : value;
            if (metadata.hasOwnProperty(item.name)) {
              metadata[item.name] = _.union(metadata[item.name], value);
            } else {
              metadata[item.name] = value;
            }
          }
          break;
        case 'checkbox':
          if (item.checked) {

            if (metadata.hasOwnProperty(item.name)) {
              metadata[item.name] = _.union(metadata[item.name], item.value);
            } else if (item.value === item.name) {
              metadata[item.name] = item.checked;
            } else {
              metadata[item.name] = item.value;
            }

          } else if (!metadata.hasOwnProperty(item.name) && item.value === item.name) {
            metadata[item.name] = item.checked;
          } else {
            metadata[item.name] = item.checked;
          }
          break;
        case 'button':
          if (value === 'true') {
            metadata[item.name] = true;
          } else if (value === 'false') {
            metadata[item.name] = false;
          }
          break;
      }
    });

    if (this.rawEditor) {
      try {
        metadata = $.extend(metadata, jsyaml.load(this.rawEditor.getValue()));
      } catch (err) {
        console.log(err);
      }
    }

    return _.extend(this.model.get('metadata'), metadata);
  },

  setValue: function(data) {
    var form = this.$el.find('.form');

    var missing = {};
    var raw;

    _(data).each(function(value, key) {
      var matched = false;
      var input = this.$el.find('[name="' + key + '"]');
      var length = input.length;
      var options;
      var tmpl;

      if (length) {

        // iterate over matching fields
        for (var i = 0; i < length; i++) {

          // if value is an array
          if (value !== null && typeof value === 'object' && value.length) {

            // iterate over values in array
            for (var j = 0; j < value.length; j++) {
              switch (input[i].type) {
              case 'select-multiple':
              case 'select-one':
                options = $(input[i]).find('option[value="' + value[j] + '"]');
                if (options.length) {
                  for (var k = 0; k < options.length; k++) {
                    options[k].selected = 'selected';
                  }

                  matched = true;
                }
                break;
              case 'text':
                input[i].value = value;
                matched = true;
                break;
              case 'checkbox':
                if (input[i].value === value) {
                  input[i].checked = 'checked';
                  matched = true;
                }
                break;
              }
            }

          } else {

            switch (input[i].type) {
            case 'select-multiple':
            case 'select-one':
              options = $(input[i]).find('option[value="' + value + '"]');
              if (options.length) {
                for (var m = 0; m < options.length; m++) {
                  options[m].selected = 'selected';
                }

                matched = true;
              }
              break;
            case 'text':
              input[i].value = value;
              matched = true;
              break;
            case 'checkbox':
              input[i].checked = value ? 'checked' : false;
              matched = true;
              break;
            case 'button':
              input[i].value = value ? true : false;
              input[i].innerHTML = value ? input[i].getAttribute('data-on') : input[i].getAttribute('data-off');
              matched = true;
              break;
            }

          }
        }

        if (!matched && value !== null) {
          if (missing.hasOwnProperty(key)) {
            missing[key] = _.union(missing[key], value);
          } else {
            missing[key] = value;
          }
        }

      } else {
        // Don't render the 'published' field or hidden metadata
        var defaults = _.find(view.model.default_metadata, function(data) { return data.name === key; });
        var diff = defaults && _.isArray(value) ? _.difference(value, defaults.field.value) : value;

        if (key !== 'published' && !defaults) {
          raw = {};
          raw[key] = value;

          if (this.rawEditor) {
            this.rawEditor.setValue(this.rawEditor.getValue() + jsyaml.dump(raw));
          }
        }
      }
    });

    _.each(missing, function(value, key) {
      if (value === null) return;

      switch (typeof value) {
      case 'boolean':
        tmpl = _(window.app.templates.checkbox).template();
        form.append(tmpl({
          name: key,
          label: value,
          value: value,
          checked: value ? 'checked' : false
        }));
        break;
      case 'string':
        tmpl = _(window.app.templates.text).template();
        form.append(tmpl({
          name: key,
          label: value,
          value: value,
          type: 'text'
        }));
        break;
      case 'object':
        tmpl = _(window.app.templates.multiselect).template();
        form.append(tmpl({
          name: key,
          label: key,
          placeholder: key,
          options: value,
          lang: data.lang || 'en'
        }));
        break;
      default:
        console.log('ERROR could not create metadata field for ' + typeof value, key + ': ' + value);
        break;
      }
    });
  },

  getRaw: function() {
    return jsyaml.dump(this.getValue()).trim();
  },

  setRaw: function(data) {
    try {
      this.setValue(jsyaml.load(data));
    } catch (err) {
      throw err;
    }
  },

  refresh: function() {
    // Refresh CodeMirror
    if (this.rawEditor) this.rawEditor.refresh();
  }
});
