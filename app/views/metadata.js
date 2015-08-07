var $ = require('jquery-browserify');
var chosen = require('chosen-jquery-browserify');
var _ = require('underscore');
_.merge = require('deepmerge');
var jsyaml = require('js-yaml');
var Backbone = require('backbone');
var templates = require('../../dist/templates');
var util = require('../util');

var forms = {
  Checkbox: require('./meta/checkbox'),
  TextForm: require('./meta/text'),
  TextArea: require('./meta/textarea'),
  Button: require('./meta/button'),
  Select: require('./meta/select'),
  Multiselect: require('./meta/multiselect'),
};


// Creates form elements that correspond to Jekyll frontmatter.
//
// Handles the reading and updating of object/key pairs
// on the file model.
//
// This view is always a child view of views/file.js.

module.exports = Backbone.View.extend({
  template: templates.metadata,

  events: {
    'change .metafield': 'updateModel',
    'click .create-select': 'createSelect',
    'click .finish': 'exit'
  },

  // @options object
  // @options.model object (file model attached to file view)
  // @options.view object (file view)
  // @options.titleAsHeading boolean
  //
  // titleAsHeading is true when the filetype is markdown,
  // and when there exists a meta field called title.
  initialize: function(options) {
    _.bindAll(this);

    this.model = options.model;
    this.titleAsHeading = options.titleAsHeading;
    this.view = options.view;

    this.subviews = [];
  },

  // Parent file view calls this render func immediately
  // after initializing this view.
  render: function() {
    this.$el.empty().append(_.template(this.template));

    var $form = this.$el.find('.form');

    var metadata = this.model.get('metadata');
    var lang = metadata && metadata.lang ? metadata.lang : 'en';

    // Using the yml configuration file for metadata,
    // render form fields.
    _.each(this.model.get('defaults'), (function(data, key) {
      var metadata = this.model.get('metadata') || {};

      // Tests that 1. This is the title metadata,
      // and 2. We've decided to combine the title form UI as the page header.
      // If both are true, then don't render this default.
      if (data && data.name === 'title' && this.titleAsHeading) {
        return;
      }

      var view = null;

      // If there's no data field, default to text field.
      if (!data || (data && !data.field)) {
        var field = {
          label: key,
          value: data,
        }
        var name = data.name ? data.name : key;
        view = new forms.TextForm({data: {
          name: name,
          type: 'text',
          field: field
        }});
      }

      // Use the data field to determine the kind of meta form to draw.
      else {
        switch (data.field.element) {
          case 'button':
            view = new forms.Button({data: data});
          break;
          case 'checkbox':
            view = new forms.Checkbox({data: data});
          break;
          case 'text':
            view = new forms.TextForm({
              data: _.extend({}, data, {type: 'text'})
            });
          break;
          case 'textarea':
            view = new forms.TextArea({
              data: _.extend({}, data, {id: util.stringToUrl(data.name)})
            });
          break;
          case 'number':
            view = new forms.TextForm({
              data: _.extend({}, data, {type: 'number'})
            });
          break;
          case 'select':
            view = new forms.Select({
              data: _.extend({}, data, {lang: lang})
            });
          break;
          case 'multiselect':
            view = new forms.Multiselect({
              data: _.extend({}, data, {lang: lang})
            });
          break;

          // On hidden values, we obviously don't have to render anything.
          // Just make sure this default is saved on the metadata object.
          case 'hidden':
            var preExisting = metadata[data.name];
            var newDefault = data.field.value;
            var newMeta = {};

            // If the pre-existing metadata is an array,
            // make sure we don't just override it, but we find the difference.
            if (_.isArray(preExisting)) {
              newMeta[data.name] = _.difference(newDefault, preExisting).length ?
                _.union(newDefault, preExisting) : preExisting;
            }
            // If pre-existing is a single property or undefined,
            // use _.extend to default to pre-existing if it exists, or
            // newDefault if there is no pre-existing.
            else {
              newMeta[data.name] = newDefault;
            }
            this.model.set('metadata', _.extend(newMeta, this.model.get('metadata') || {}));
          break;
        }
      }

      if (view !== null) {
        $form.append(view.render());
        this.subviews.push(view);

        // If the view is a text area, we'll need to init codemirror.
        if (data && data.field && data.field.element === 'textarea') {
          var id = util.stringToUrl(data.name);

          // TODO passing in a bound callback is not the best
          // as it increases the debugging surface area.
          // Find some way to get around this.
          var codeMirror = view.initCodeMirror(this.updateModel.bind(this));

          // TODO fix collision here
          this[id] = codeMirror;
        }
      }
    }).bind(this));

    // Attach a change event listener
    this.$el.find('.chzn-select').chosen().change(this.updateModel);

    // Renders the raw metadata textarea form
    this.renderRawEditor();

    // Now that we've rendered the form elements according
    // to defaults, sync the form elements with the current metadata.
    // TODO it seems like
    this.setValue(this.model.get('metadata'));

    return this;
  },

  // Convenience method to save changes to file model
  // on some sort of event callback.
  //
  // fileView.makeDirty() calls set on the file model,
  // known locally here as this.model, using this.getValue(),
  // which is below.
  //
  // TODO calling the parent view so it can set it's model based
  // on a method in the child (this) view is too heavy-handed coupling.
  // Since this view has access to the proper model, it should
  // do the updating here.
  //
  // TODO calling updateModel on a checkbox change means the metadata
  // value is set to the name (or value) of the element, not true or false.
  //
  // TODO in general this function sucks. It sets the metadata naively using
  // form.value, which can easily throw off tests for checkboxes and numbers.
  // It also calls view.makeDirty(), which sets the metadata anyway.
  // Investigate whether we can avoid calling model.set here.
  updateModel: function(e) {
    var target = e.currentTarget;
    var delta = {};
    delta[target.name] = target.value;
    this.model.set('metadata', _.extend(this.model.get('metadata'), delta));
    this.view.makeDirty();
  },

  // TODO This.view is vague and doesn't get across that we're
  // communicating with the parent file view.
  //
  // It also doesn't get across that we're performing a save operation.
  rawKeyMap: function() {
    return {
      'Ctrl-S': this.view.updateFile
    };
  },

  // Responsible for rendering the raw metadata element
  // and listening for changes.
  renderRawEditor: function() {
    var isYaml = this.model.get('lang') === 'yaml';
    var $parent
    if (isYaml) {
      $parent = this.view.$el.find('#code');
      $parent.empty();
    }
    else {
      this.$el.find('.form').append(_.template(templates.meta.raw));
      $parent = this.$el.find('#raw');
    }

    this.rawEditor = CodeMirror($parent[0], {
      mode: 'yaml',
      value: '',
      lineWrapping: true,
      lineNumbers: isYaml,
      extraKeys: this.rawKeyMap(),
      theme: 'prose-bright'
    });

    this.listenTo(this.rawEditor, 'blur', (function(codeMirror) {
      try {
        var rawValue = jsyaml.safeLoad(codeMirror.getValue());
      } catch(err) {
        console.log("Error parsing CodeMirror editor text");
        console.log(err);
      }
      if (rawValue) {
        var metadata = this.model.get('metadata');
        this.model.set('metadata', _.extend(metadata, rawValue));
        this.view.makeDirty();
      }
    }).bind(this));
  },

  getValue: function() {
    var view = this;
    var metadata = this.model.get('metadata') || {};


    // First get values from all subviews.
    _.each(this.subviews, function(view) {
      var value = view.getValue();


    });


    // TODO this would always seem to default metadata.published to true.
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

    // Extracts values from each native form element.
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
          // TODO this is broken in that it returns the value, which is
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
    // aka this is what gets stuff from the textareas.
    // TODO getValue is probably throwing an error here.
    // TODO this is also causing name collisions.
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
    if (this.rawEditor) {
      try {
        metadata = _.merge(metadata, jsyaml.safeLoad(this.rawEditor.getValue()) || {});
      } catch (err) {
        console.log("Error parsing not defined raw yaml front matter");
        console.log(err);
      }
    }

    return metadata;
  },

  // @metadata object metadata key/value pairs
  // Syncs the visual UI with what's currently saved on the model.
  setValue: function(metadata) {
    /*
    console.log(this.subviews);
    // For each metadata key/value pair, check to see if it exists.
    // And if it does, update it's value as shown.
    // If no matches are found, attempt to create a new field.
    _.each(metadata, function(value, key) {
      console.log(value, key);
    });

    */


    var form = this.$el.find('.form');
    var missing = {};
    var raw;


    // For each metadata key/value pair, check to see if it exists,
    // and if it does, update it's value.
    // If no matches are found, attempt to create a new field.
    _.each(metadata, (function(value, key) {
      var matched = false;
      var input = this.$el.find('[name="' + key + '"]');
      var options;

      if (input.length) {

        // iterate over matching fields
        for (var i = 0; i < input.length; i++) {

          // if value is an array
          // TODO check if value is ever an array.
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

        // TODO Kind of a silly way to determine whether this is the raw editor or not.
        if (key !== 'published' && key !== 'title' && !defaults) {
          raw = {};
          raw[key] = value;

          if (this.rawEditor) {
            this.rawEditor.setValue(this.rawEditor.getValue() + jsyaml.safeDump(raw));
          }
        }
      }
    }).bind(this));

    // TODO is this necessary? Do we ever get a missing value?
    // What case does this cover?
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
          lang: metadata.lang || 'en'
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

  refresh: function() {
    var view = this;
    this.$el.find('.yaml-block').each(function() {
      var editor = $(this).find('.CodeMirror').attr('id');
      // TODO instance of possible name collision.
      if (view[editor]) view[editor].refresh();
    });

    // Refresh CodeMirror
    if (this.rawEditor) this.rawEditor.refresh();
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
