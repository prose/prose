var $ = require('jquery-browserify');
var _ = require('underscore');
var sinon = require('sinon');
var MetadataView = require('../../../app/views/metadata');
var templates = require('../../../dist/templates');

'use strict';

describe('Metadata editor view', function() {

  // first, mock the three arguments that we pass to Metadataview
  //
  // @param {object} model, /app/models/file.js
  // @param {string} titleAsHeading, in /app/views/file.js returns post title or false
  // @param {object} view, /app/views/file.js

  // Fake Backbone.Model api, mocking /app/models/file.js
  var MockFileModel = function() {
    this.attributes = {
      defaults: [],
      lang: 'gfm',
      metadata: {},
    };
    this.get = function(key) {
        return this.attributes[key];
    };
    this.set = function(key, value) {
        this.attributes[key] = value;
    };
  };

  // MetadataView calls this.header.inputGet when there is a title metafield.
  // Mock this function so the view doesn't throw an error.
  var titleAsHeading = 'This is a blog post';
  var MockFileView = function() {
    this.header = {
      inputGet: function() {
        return titleAsHeading;
      },
    };
    this.makeDirty = function() { return };
  };

  // function-level reference to model,
  // so we can clear it's attributes in beforeEach()
  var model = new MockFileModel();

  // function-level reference to MetaDataView
  // so we can call it's remove function in afterEach()
  var metadataEditor;

  beforeEach(function() {
    // Create a #meta div and append it to test page.
    // This gets used as metadataEditor's $el property.
    // Useful to mock DOM interactions.
    var $el = $('<div />', {
        id: 'meta',
        html: _.template(templates.metadata)
    }).appendTo($('body'));

    // Reset the model attributes
    model.attributes = {
      defaults: [],
      lang: 'gfm',
      metadata: {},
    };

  });

  afterEach(function() {
    $('#meta').remove();
    if(metadataEditor.remove) {
      metadataEditor.remove();
    }
  });

  describe('creating editor elements', function() {

    // Without any defaults, we should only see the raw meta element
    it('shows a raw editor', function() {
      metadataEditor = new MetadataView({
        model: new MockFileModel(),
        titleAsHeading: titleAsHeading,
        view: new MockFileView(),
        el: $('#meta'),
      });
      metadataEditor.render();
      expect( $('#meta').find('.form-item').length ).to.equal(1);
    });

    it('does not append title and hidden meta elements', function() {
      model.set('defaults', [
        {
          name: 'title',
          field: {
            element: 'text',
            label: 'title',
            value: 'foo'
          }
        },
        {
          name: 'tags',
          field: {
            element: 'text',
            label: 'tags',
            value: 'one two three'
          }
        },
        {
          name: 'layout',
          field: {
            element: 'hidden',
            value: 'fixed'
          }
        },
      ]);
      metadataEditor = new MetadataView({
        model: model,
        titleAsHeading: titleAsHeading,
        view: new MockFileView(),
        el: $('#meta'),
      });
      metadataEditor.render();

      // only appends one meta element for tags (in addition to raw meta element)
      expect( $('#meta').find('.form-item').length ).to.equal(2);
    });

    it('autofills default metadata on textarea elements', function() {
      var value = 'here is some metadata';
      model.set('defaults', [
        {
          name: 'foo',
          field: {
            element: 'textarea',
            label: 'bar',
            value: value,
          }
        }
      ]);

      metadataEditor = new MetadataView({
        model: model,
        titleAsHeading: titleAsHeading,
        view: new MockFileView(),
        el: $('#meta'),
      });
      metadataEditor.render();

      expect( metadataEditor.foo.getValue() ).to.equal(value);
    });

    // Metadata object saves references to code-mirror'd textarea elements
    // on itself, or 'this', during render function.
    // This has the potential to overwrite native methods.
    it('textarea names do not collide with view methods', function() {
      model.set('defaults', [
        {
          name: 'view',
          field: {
            element: 'textarea',
          }
        }
      ]);
      var view = new MockFileView();
      metadataEditor = new MetadataView({
        model: model,
        titleAsHeading: titleAsHeading,
        view: view,
        el: $('#meta'),
      });
      metadataEditor.render();
      expect( metadataEditor.view ).to.deep.equal(view);
    });

  }); // end of creating meta editor elements

  describe('saving changes', function() {

    it('saves changes to model on text element change', function() {
      var value = 'this is the old value';
      model.set('defaults', [
        {
          name: 'foo',
          field: {
            element: 'text',
            value: value,
          }
        }
      ]);

      metadataEditor = new MetadataView({
        model: model,
        titleAsHeading: titleAsHeading,
        view: new MockFileView(),
        el: $('#meta'),
      });
      metadataEditor.render();

      // After setting the value of the text input to a different string,
      // manually trigger a change event to run updateModel
      value = 'should be this new value';
      $('#meta').find('[name="foo"]').val(value);
      $('.metafield').trigger('change');
      expect( model.get('metadata').foo ).to.equal(value);
    });

    it('saves changes to model on textarea element change', function() {
      var value = 'this is the old value';
      model.set('defaults', [
        {
          name: 'foo',
          field: {
            element: 'textarea',
            label: 'bar',
            value: value,
          }
        }
      ]);

      metadataEditor = new MetadataView({
        model: model,
        titleAsHeading: titleAsHeading,
        view: new MockFileView(),
        el: $('#meta'),
      });
      metadataEditor.render();

      // Attaching a spy to updateModel lets us know later that
      // our fake DOM manipulation actually triggered the view to update it's model
      var spy = sinon.spy(metadataEditor, 'updateModel');

      // Set a new value using codemirror api, then focus elsewhere using jQuery.
      value = 'should be this new value';
      metadataEditor.foo.focus();
      metadataEditor.foo.setValue(value);
      $('body').focus();

      // Did the view know to update it's model?
      //expect( spy.called ).to.equal(true);

      expect( model.get('metadata').foo ).to.equal(value);
    });

  }); // end of saving changes

});
