var CodeMirror = require('codemirror');
var $ = require('jquery-browserify');
var chosen = require('chosen-jquery-browserify');
var _ = require('lodash');
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
    'click button.metafield': 'updateModel',
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
    this.model = options.model;
    this.titleAsHeading = options.titleAsHeading;
    this.view = options.view;

    this.subviews = [];
    this.codeMirrorInstances = {};
  },

  // Parent file view calls this render func immediately
  // after initializing this view.
  // This is responsible for rendering metadata fields for each *default*.
  render: function() {
    this.$el.empty().append(_.template(this.template));

    var $form = this.$el.find('.form');

    var metadata = this.model.get('metadata') || {};
    var lang = metadata && metadata.lang ? metadata.lang : 'en';

    // Using the yml configuration file for metadata,
    // render form fields.
    _.each(this.model.get('defaults'), (function(data, key) {

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
            var newDefault = data.field.value || '';
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
            this.model.set('metadata', _.extend(newMeta, this.model.get('metadata')));
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

          this.codeMirrorInstances[id] = codeMirror;
        }
      }
    }).bind(this));

    // Attach a change event listener
    this.$el.find('.chzn-select').chosen().change(this.updateModel);

    // Renders the raw metadata textarea form
    this.renderRawEditor();

    // Now that we've rendered the form elements according
    // to defaults, sync the form elements with the current metadata.
    this.setValue(this.model.get('metadata'));

    // Now that we've synced the values from metadata, do a save to model.
    // Important because some elements, such as buttons, rely on a default
    // and don't save to the metadata model until we explicitly call this.
    this.model.set('metadata', this.getValue());

    return this;
  },

  // Record metadata, signal to file that a save is possible.
  updateModel: function() {
    this.model.set('metadata', this.getValue());
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

    this.codeMirrorInstances.rawEditor = CodeMirror($parent[0], {
      mode: 'yaml',
      value: '',
      lineWrapping: true,
      lineNumbers: isYaml,
      extraKeys: this.rawKeyMap(),
      theme: 'prose-bright'
    });

    this.listenTo(this.codeMirrorInstances.rawEditor, 'blur', (function(codeMirror) {
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

    // It's important to save only the data that's represented
    // by the current meta elements.
    // Even if there are elements with the same name.
    _.chain(this.subviews).map(function(view) {
      return {
        value: view.getValue(),
        name: view.name
      };
    }).groupBy('name').each(function(group) {
      var name = group[0].name;
      metadata[name] = group.length === 1 ?
        group[0].value : _.pluck(group, 'value');
    });

    // TODO does this always default metadata.published to true?
    if (this.view.toolbar &&
       this.view.toolbar.publishState() ||
       (metadata && metadata.published)) {
      metadata.published = true;
    } else {
      metadata.published = false;
    }

    // Get the title value from heading if it's available.
    // In testing environment, if the header doesn't render
    // then this.view.header is undefined.
     if (this.titleAsHeading && this.view.header) {
      metadata.title = this.view.header.inputGet();
    }

    // Load any data coming from not defined raw yaml front matter.
    if (this.codeMirrorInstances.rawEditor) {
      try {
        metadata = _.merge(metadata, jsyaml.safeLoad(this.codeMirrorInstances.rawEditor.getValue()) || {});
      } catch (err) {
        console.log("Error parsing not defined raw yaml front matter");
        console.log(err);
      }
    }

    // Remove metadata elements where values are empty strings,
    // unless they are the title, or are hidden.
    for (var key in metadata) {
      if (key !== 'title' && metadata[key] === '') {
        delete metadata[key];
      }
    }

    return metadata;
  },

  // @metadata object metadata key/value pairs
  // Syncs the visual UI with what's currently saved on the model.
  setValue: function(metadata) {

    // The key point here is that the UI reflects exactly
    // what's in the metadata.
    // By now we've already rendered our elements along with
    // the correct defaults.
    metadata = metadata || {};
    var rawEditor = this.codeMirrorInstances.rawEditor;
    var subviews = this.subviews;
    var defaults = this.model.get('defaults') || [];
    var hidden = defaults.filter(function(d) {
      return d.field && d.field.element === 'hidden';
    });

    // Easiest thing to do is update metadata fields
    // that are rendered already, ie. have defaults specified
    // in _config.yml or _prose.yml
    _.each(metadata, function(value, key) {

      // Filter instead of find, because you never know if someone
      // is using the same key for two different elements.
      var renderedViews = _.filter(subviews, function(view) {
        return view.name === key;
      });

      // If there are n rendered views corresponding to n
      // metadata values of the same name, assign values based on order.
      // This works because metadata yaml is parsed in order, and
      // subviews is an ordered array.
      if (renderedViews.length && _.isArray(value)
          && value.length === renderedViews.length) {
        _.each(renderedViews, function(view, i) {
          view.setValue(value[i]);
        });
      }
      else if (renderedViews.length === 1) {
        renderedViews[0].setValue(value);
      }

      // Next is to take any metadata field that doesn't have a form,
      // and throw it into the raw editor.
      // Note, we don't want to include hidden elements,
      // titles, or published states here.
      else if (!renderedViews.length && value &&
               key !== 'title' && key !== 'published' &&
               !_.find(hidden, function(d) { return d.name === key })){
        var raw = {};
        raw[key] = value;
        rawEditor.setValue(rawEditor.getValue() + jsyaml.safeDump(raw));
      }
    });
  },

  refresh: function() {
    _.each(this.codeMirrorInstances, function(codeMirror) {
      codeMirror.refresh();
    });
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
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = [];
    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
