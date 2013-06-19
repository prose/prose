var $ = require('jquery-browserify');
var _ = require('underscore');
_.merge = require('deepmerge');

var queue = require('queue-async');
var jsyaml = require('js-yaml');

var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.metadata),

  events: {
    'change input': 'makeDirty',
    'click .finish': 'exit'
  },

  initialize: function(options) {
    _.bindAll(this);

    this.model = options.model;
    this.view = options.view;

    this.config = this.model.collection.findWhere({ path: '_prose.yml' }) ||
      this.model.collection.findWhere({ path: '_config.yml' });

    // render view once config content has loaded
    if (this.model.get('defaults')) {
      this.render();
    } else {
      this.config.fetch({ success: this.setDefaults });
    }
  },

  rawKeyMap: function() {
    return {
      'Ctrl-S': this.view.updateFile
    };
  },

  nearestPath: function(metadata) {
    // match nearest parent directory default metadata
    var path = this.model.get('path');
    var nearestDir = /\/(?!.*\/).*$/;

    while (metadata[path] === undefined && path.match( nearestDir )) {
      path = path.replace( nearestDir, '' );
    }

    return path;
  },

  setDefaults: function() {
    var q = queue();
    var content = this.config.get('content');

    // Set empty defaults on model if no match
    // to avoid loading _config.yml again unecessarily
    var defaults = {};

    var config;
    var metadata;
    var path;
    var raw;

    try {
      config = jsyaml.load(content);
    } catch(err) {
      throw err;
    }

    if (config && config.prose && config.prose.metadata) {
      metadata = config.prose.metadata;
      path = this.nearestPath(metadata);

      if (metadata[path]) {
        raw = config.prose.metadata[path];

        if (_.isObject(raw)) {
          defaults = raw;

          _.each(defaults, function(value, key) {

            // Parse JSON URL values
            if (value.field && value.field.options &&
                _.isString(value.field.options) &&
                value.field.options.match(/^https?:\/\//)) {

              q.defer(function(cb) {
                $.ajax({
                  cache: true,
                  dataType: 'jsonp',
                  jsonp: false,
                  jsonpCallback: value.field.options.split('?callback=')[1] || 'callback',
                  url: value.field.options,
                  success: function(d) {
                    value.field.options = d;
                    cb();
                  }
                });
              });
            }

          });
        } else if (_.isString(raw)) {
          try {
            defaults = jsyaml.load(raw);

            if (defaults.date === "CURRENT_DATETIME") {
              var current = (new Date()).format('Y-m-d H:i');
              defaults.date = current;
              raw = raw.replace("CURRENT_DATETIME", current);
            }
          } catch(err) {
            throw err;
          }
        }
      }
    }

    this.model.set('defaults', defaults);

    this.render();
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
  },

  render: function() {
    this.$el.html(this.template({}));

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
              placeholder: data.field.placeholder,
              options: data.field.options,
              lang: lang
            }));
            break;
          case 'hidden':
            tmpl = {};
            tmpl[data.name] = data.field.value;
            this.model.set('metadata', _.merge(tmpl, this.model.get('metadata')));
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

    // this.setValue(this.model.get('metadata'));
    
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
    if (this.raw) this.raw.refresh();
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
