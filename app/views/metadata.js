var $ = require('jquery-browserify');
var chosen = require('chosen-jquery-browserify');
var _ = require('underscore');
_.merge = require('deepmerge');
var jsyaml = require('js-yaml');
var Backbone = require('backbone');
var templates = require('../../dist/templates');
var util = require('.././util');

module.exports = Backbone.View.extend({
  template: templates.metadata,

  events: {
    'change .metafield': 'updateModel',
    'click .create-select': 'createSelect',
    'click .finish': 'exit'
  },

  initialize: function(options) {
    _.bindAll(this);

    this.model = options.model;
    this.titleAsHeading = options.titleAsHeading;
    this.view = options.view;
  },

  render: function() {
    this.$el.empty().append(_.template(this.template));

    var form = this.$el.find('.form');

    var metadata = this.model.get('metadata');
    var lang = metadata && metadata.lang ? metadata.lang : 'en';

    // This renders any fields defined in the metadata entry
    // of a given prose configuration file.
    _.each(this.model.get('defaults'), (function(data, key) {
      var metadata = this.model.get('metadata') || {};
      var renderTitle = true;

      if (data && data.name === 'title' && this.titleAsHeading) {
        renderTitle = false;
      }

      if (renderTitle) {
        if (data && data.field) {
          switch (data.field.element) {
            case 'button':
              var button = {
                name: data.name,
                label: data.field.label,
                help: data.field.help,
                on: data.field.on,
                off: data.field.off
              };

              form.append(_.template(templates.meta.button, button, {
                variable: 'meta'
              }));
              break;
            case 'checkbox':
              var checkbox = {
                name: data.name,
                label: data.field.label,
                help: data.field.help,
                value: data.name,
                checked: data.field.value
              };

              form.append(_.template(templates.meta.checkbox, checkbox, {
                variable: 'meta'
              }));
              break;
            case 'text':
              var text = {
                name: data.name,
                label: data.field.label,
                help: data.field.help,
                value: data.field.value,
                placeholder: data.field.placeholder,
                type: 'text'
              };

              form.append(_.template(templates.meta.text, text, {
                variable: 'meta'
              }));
              break;
            case 'textarea':
              var id = util.stringToUrl(data.name);
              var textarea = {
                name: data.name,
                id: id,
                value: data.field.value,
                label: data.field.label,
                help: data.field.help,
                placeholder: data.field.placeholder,
                type: 'textarea'
              };

              form.append(_.template(templates.meta.textarea, textarea, {
                variable: 'meta'
              }));

              var textElement = document.getElementById(id);

              this[id] = CodeMirror(function(el) {
                textElement.parentNode.replaceChild(el, textElement);
                el.id = id;
                el.className += ' inner ';
                el.setAttribute('data-name', data.name);
              }, {
                mode: id,
                value: textElement.value,
                lineWrapping: true,
                theme: 'prose-bright'
              });

              break;
            case 'number':
              var number = {
                name: data.name,
                label: data.field.label,
                help: data.field.help,
                value: data.field.value,
                type: 'number'
              };

              form.append(_.template(templates.meta.text, number, {
                variable: 'meta'
              }));
              break;
            case 'select':
              var select = {
                name: data.name,
                label: data.field.label,
                help: data.field.help,
                placeholder: data.field.placeholder,
                options: data.field.options,
                lang: lang
              };

              form.append(_.template(templates.meta.select, select, {
                variable: 'meta'
              }));
              break;
            case 'multiselect':
              var multiselect = {
                name: data.name,
                label: data.field.label,
                help: data.field.help,
                alterable: data.field.alterable,
                placeholder: data.field.placeholder,
                options: data.field.options,
                lang: lang
              };

              form.append(_.template(templates.meta.multiselect, multiselect, {
                variable: 'meta'
              }));

              break;
            case 'hidden':
              var tmpl = {};
              var value = metadata[data.name];

              if (_.isArray(value)) {
                // Any defaults not currently in metadata?
                var diff = _.difference(data.field.value, value);
                tmpl[data.name] = diff.length ?
                  _.union(data.field.value, value) : value;
              } else {
                tmpl[data.name] = data.field.value;
              }

              this.model.set('metadata', _.extend(tmpl, this.model.get('metadata') || {}));
              break;
          }
        } else {
          var txt = {
            name: key,
            label: key,
            value: data,
            type: 'text'
          };

          form.append(_.template(templates.meta.text, txt, {
            variable: 'meta'
          }));
        }
      }
    }).bind(this));

    this.$el.find('.chzn-select').chosen().change(this.updateModel);
    this.renderRaw();

    return this;
  },

  updateModel: function(e) {
    var target = e.currentTarget;
    var key = target.name;
    var value = target.value;
    var delta = {};
    delta[key] = value;

    var metadata = this.model.get('metadata');
    this.model.set('metadata', _.extend(metadata, delta));
    this.view.makeDirty();
  },

  rawKeyMap: function() {
    return {
      'Ctrl-S': this.view.updateFile
    };
  },

  renderRaw: function() {
    var yaml = this.model.get('lang') === 'yaml';
    var $el;

    if (yaml) {
      $el = this.view.$el.find('#code');
      $el.empty();
    } else {
      this.$el.find('.form').append(_.template(templates.meta.raw));
    }

    var el = (yaml ? $el : this.$el.find('#raw'))[0];

    this.raw = CodeMirror(el, {
      mode: 'yaml',
      value: '',
      lineWrapping: true,
      lineNumbers: yaml,
      extraKeys: this.rawKeyMap(),
      theme: 'prose-bright'
    });

    this.listenTo(this.raw, 'blur', (function(cm) {
      var value = cm.getValue();
      var raw;

      try {
        raw = jsyaml.safeLoad(value);
      } catch(err) {
        console.log("Error parsing CodeMirror editor text");
        console.log(err);
      }

      if (raw) {
        var metadata = this.model.get('metadata');
        this.model.set('metadata', _.extend(metadata, raw));

        this.view.makeDirty();
      }
    }).bind(this));

    this.setValue(this.model.get('metadata'));
  },

  getValue: function() {
    var view = this;
    var metadata = this.model.get('metadata') || {};

    if (this.view.toolbar &&
       this.view.toolbar.publishState() ||
       (metadata && metadata.published)) {
      metadata.published = true;
    } else {
      metadata.published = false;
    }

    // Get the title value from heading if we need to.
    if (this.titleAsHeading) {
      metadata.title = (this.view.header) ?
        this.view.header.inputGet() :
        this.model.get('metadata').title[0];
    }

    _.each(this.$el.find('[name]'), function(item) {
      var $item = $(item);
      var value = $item.val();

      switch (item.type) {
        case 'select-multiple':
        case 'select-one':
        case 'textarea':
        case 'text':
          if (value) {
            value = $item.data('type') === 'number' ? Number(value) : value;
            if (_.has(metadata, item.name) && metadata[item.name] !== value) {
              metadata[item.name] = _.union(metadata[item.name], value);
            } else {
              metadata[item.name] = value;
            }
          }
          break;
        case 'checkbox':
          if (item.checked) {

            if (_.has(metadata, item.name) && item.name !== item.value) {
              metadata[item.name] = _.union(metadata[item.name], item.value);
            } else if (item.value === item.name) {
              metadata[item.name] = item.checked;
            } else {
              metadata[item.name] = item.value;
            }

          } else if (!_.has(metadata, item.name) && item.name === item.value) {
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

    // Load any data coming from a yaml-block of content.
    this.$el.find('.yaml-block').each(function() {
      var editor = $(this).find('.CodeMirror').attr('id');
      var name = $('#' + editor).data('name');

      if (view[editor]) {
        try {
          metadata[name] = jsyaml.safeLoad(view[editor].getValue());
        } catch(err) {
          console.log("Error parsing yaml front matter");
          console.log(err);
        }
      }
    });

    // Load any data coming from not defined raw yaml front matter.
    if (this.raw) {
      try {
        metadata = _.merge(metadata, jsyaml.safeLoad(this.raw.getValue()) || {});
      } catch (err) {
        console.log("Error parsing not defined raw yaml front matter");
        console.log(err);
      }
    }

    return metadata;
  },

  setValue: function(data) {
    var form = this.$el.find('.form');
    var missing = {};
    var raw;

    _.each(data, (function(value, key) {
      var matched = false;
      var input = this.$el.find('[name="' + key + '"]');
      var length = input.length;
      var options;

      if (length) {

        // iterate over matching fields
        for (var i = 0; i < length; i++) {

          // if value is an array
          if (_.isArray(value)) {

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
                case 'textarea':
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
              case 'textarea':
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
          if (missing.hasOwnProperty(key) && missing[key] !== value) {
            missing[key] = _.union(missing[key], value);
          } else {
            missing[key] = value;
          }
        }

      } else {
        // Don't render the 'published' field or hidden metadata
        // TODO: render metadata values that share a key with a hidden value
        var defaults = _.find(this.model.get('defaults'), function(data) { return data && (data.name === key); });
        var diff = defaults && _.isArray(value) ? _.difference(value, defaults.field.value) : value;

        if (key !== 'published' && key !== 'title' && !defaults) {
          raw = {};
          raw[key] = value;

          if (this.raw) {
            this.raw.setValue(this.raw.getValue() + jsyaml.safeDump(raw));
          }
        }
      }
    }).bind(this));

    _.each(missing, (function(value, key) {
      if (value === null) return;

      switch (typeof value) {
        case 'boolean':
          var bool = {
            name: key,
            label: value,
            value: value,
            checked: value ? 'checked' : false
          };

          form.append(_.template(templates.meta.checkbox, bool, {
            variable: 'meta'
          }));
          break;
        case 'string':
          var string = {
            name: key,
            label: value,
            value: value,
            type: 'text'
          };

          form.append(_.template(templates.meta.text, string, {
            variable: 'meta'
          }));
          break;
        case 'object':
          var obj = {
            name: key,
            label: key,
            placeholder: key,
            options: value,
            lang: data.lang || 'en'
          };

          form.append(_.template(templates.meta.multiselect, obj, {
            variable: 'meta'
          }));
          break;
        default:
          console.log('ERROR could not create metadata field for ' + typeof value, key + ': ' + value);
          break;
      }

      this.$el.find('.chzn-select').chosen().change(this.updateModel);
    }).bind(this));

    this.$el.find('.chzn-select').trigger('liszt:updated');

    // Update model with defaults
    // TODO: should this makeDirty if any differences?
    this.model.set('metadata', this.getValue());
  },

  getRaw: function() {
    return jsyaml.safeDump(this.getValue()).trim();
  },

  setRaw: function(data) {
    try {
      this.raw.setValue(jsyaml.safeDump(data));
      this.refresh;
    } catch (err) {
      throw err;
    }
  },

  refresh: function() {
    var view = this;
    this.$el.find('.yaml-block').each(function() {
      var editor = $(this).find('.CodeMirror').attr('id');
      if (view[editor]) view[editor].refresh();
    });

    // Refresh CodeMirror
    if (this.raw) this.raw.refresh();
  },

  createSelect: function(e) {
    var $parent = $(e.target).parent();
    var $input = $parent.find('input');
    var selectTarget = $(e.target).data('select');
    var $select = this.$el.find('#' + selectTarget);
    var value = _($input.val()).escape();

    if (value.length > 0) {
      var option = '<option value="' + value + '" selected="selected">' + value + '</option>';

      // Append this new option to the select list.
      $select.append(option);

      // Clear the now added value.
      $input.attr('value', '');

      // Update the list
      $select.trigger('liszt:updated');
      $select.trigger('change');
    }

    return false;
  },

  exit: function() {
    this.view.nav.active(this.view.mode);

    if (this.view.mode === 'blob') {
      this.view.blob();
    } else {
      this.view.edit();
    }

    return false;
  }
});
