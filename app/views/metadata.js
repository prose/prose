var $ = require('jquery-browserify');
var _ = require('underscore');
_.merge = require('deepmerge');
var jsyaml = require('js-yaml');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.metadata),

  events: {
    'change input': 'makeDirty',
    'click .create-select': 'createSelect',
    'click .finish': 'exit'
  },

  initialize: function(options) {
    _.bindAll(this);

    this.model = options.model;
    this.view = options.view;
  },

  render: function() {
    this.$el.html(this.template());

    var form = this.$el.find('.form');
    var lang = this.model.get('metadata').lang || 'en';
    var tmpl;

    _.each(this.model.get('defaults'), (function(data, key) {
      if (data && data.field) {
        switch (data.field.element) {
          case 'button':
            tmpl = _.template(templates.meta.button);
            form.append(tmpl({
              name: data.name,
              label: data.field.label,
              value: data.field.value,
              on: data.field.on,
              off: data.field.off
            }));
            break;
          case 'checkbox':
            tmpl = _.template(templates.meta.checkbox);
            form.append(tmpl({
              name: data.name,
              label: data.field.label,
              value: data.name,
              checked: data.field.value
            }));
            break;
          case 'text':
            tmpl = _.template(templates.meta.text);
            form.append(tmpl({
              name: data.name,
              label: data.field.label,
              value: data.field.value,
              type: 'text'
            }));
            break;
        case 'textarea':
          tmpl = _.template(templates.meta.textarea);
          var id = _.stringToUrl(data.name);

          form.append(tmpl({
            name: data.name,
            id: id,
            value: data.field.value,
            label: data.field.label,
            type: 'textarea'
          }));

          _.defer(function() {
            var textarea = document.getElementById(id);
            view[id] = CodeMirror(function(el) {
              textarea.parentNode.replaceChild(el, textarea);
              el.id = id;
              el.className += ' inner ';
              el.setAttribute('data-name', data.name);
            }, {
              mode: id,
              value: textarea.value,
              lineWrapping: true,
              theme: 'prose-bright'
            });
          });
          break;
          case 'number':
            tmpl = _.template(templates.meta.text);
            form.append(tmpl({
              name: data.name,
              label: data.field.label,
              value: data.field.value,
              type: 'number'
            }));
            break;
          case 'select':
            tmpl = _.template(templates.meta.select);
            form.append(tmpl({
              name: data.name,
              label: data.field.label,
              placeholder: data.field.placeholder,
              options: data.field.options,
              lang: lang
            }));
            break;
          case 'multiselect':
            tmpl = _.template(templates.meta.multiselect);
            form.append(tmpl({
              name: data.name,
              label: data.field.label,
              alterable: data.field.alterable,
              placeholder: data.field.placeholder,
              options: data.field.options,
              lang: lang
            }));
            break;
          case 'hidden':
            tmpl = {};
            tmpl[data.name] = data.field.value;
            this.model.set('metadata', _.merge(tmpl, this.model.get('metadata')));
            this.model.set('hidden', _.merge(tmpl, this.model.get('hidden') || {}));
            break;
        }
      } else {
        tmpl = _.template(templates.meta.text);
        form.append(tmpl({
          name: key,
          label: key,
          value: data,
          type: 'text'
        }));
      }
    }).bind(this));

    $('.chzn-select').chosen();

    this.renderRaw();
    return this;
  },

  rawKeyMap: function() {
    return {
      'Ctrl-S': this.view.updateFile
    };
  },

  renderRaw: function() {
    var selector = this.model.get('lang') === 'yaml' ? 'code' : 'raw';

    if (selector === 'raw') {
      this.$el.find('.form').append(_.template(templates.meta.raw));
    }

    this.raw = CodeMirror(document.getElementById(selector), {
      mode: 'yaml',
      value: '',
      lineWrapping: true,
      extraKeys: this.rawKeyMap(),
      theme: 'prose-bright'
    });

    this.listenTo(this.raw, 'change', this.view.makeDirty);
    this.setValue(this.model.get('metadata'));
  },

  getValue: function() {
    var view = this;
    var metadata = {};

    // TODO Do the same with title
    if (this.view.toolbar.publishState()) {
      metadata.published = true;
    } else {
      metadata.published = false;
    }

    // Get the title value from heading
    // if we need to.
    if (this.view.titleAsHeading()) {
      metadata.title = this.view.heading.inputGet();
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

    // Load any data coming from a yaml-block of content.
    this.$el.find('.yaml-block').each(function() {
      var editor = $(this).find('.CodeMirror').attr('id');
      var name = $('#' + editor).data('name');

      if (view[editor]) {
        metadata[name] = jsyaml.load(view[editor].getValue());
      }
    });

    // Load any data coming from not defined raw yaml front matter.
    if (this.raw) {
      try {
        metadata = _.merge(metadata, jsyaml.load(this.raw.getValue()) || {});
      } catch (err) {
        throw err;
      }
    }

    return _.merge(this.model.get('hidden'), metadata);
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
      var tmpl;

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
        // TODO: render metadata values that share a key with a hidden value
        var defaults = _.find(this.model.get('defaults'), function(data) { return data.name === key; });
        var diff = defaults && _.isArray(value) ? _.difference(value, defaults.field.value) : value;

        if (key !== 'published' &&
            key !== 'title' &&
            !defaults) {
          raw = {};
          raw[key] = value;

          if (this.raw) {
            this.raw.setValue(this.raw.getValue() + jsyaml.dump(raw));
          }
        }
      }
    }).bind(this));

    _.each(missing, (function(value, key) {
      if (value === null) return;

      switch (typeof value) {
        case 'boolean':
          tmpl = _.template(templates.meta.checkbox);
          form.append(tmpl({
            name: key,
            label: value,
            value: value,
            checked: value ? 'checked' : false
          }));
          break;
        case 'string':
          tmpl = _.template(templates.meta.text);
          form.append(tmpl({
            name: key,
            label: value,
            value: value,
            type: 'text'
          }));
          break;
        case 'object':
          tmpl = _.template(templates.meta.multiselect);
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

      this.$el.find('.chzn-select').chosen();
    }).bind(this));

    this.$el.find('.chzn-select').trigger('liszt:updated');
  },

  getRaw: function() {
    return jsyaml.dump(this.getValue()).trim();
  },

  setRaw: function(data) {
    try {
      this.raw.setValue(jsyaml.dump(data));
      this.refresh;
    } catch (err) {
      throw err;
    }
  },

  refresh: function() {
    // Refresh CodeMirror
    if (this.raw) this.raw.refresh();
  },

  createSelect: function(e) {
    var $parent = $(e.target).parent();
    var $input = $parent.find('input');
    var selectTarget = $(e.target).data('select');
    var $select = this.$el.find('#' + selectTarget);
    var value = $input.val();

    if (value.length > 0) {
      var option = '<option value="' + value + '" selected="selected">' + value + '</option>';

      // Append this new option to the select list.
      $select.append(option);

      // Clear the now added value.
      $input.attr('value', '');

      // Update the list
      $select.trigger('liszt:updated');
    }

    return false;
  },

  exit: function() {
    this.view.nav.active(this.view.mode);

    if (this.view.mode === 'blob') {
      this.view.preview();
    } else {
      this.view.edit();
    }

    return false;
  }
});
