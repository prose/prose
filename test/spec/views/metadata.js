var MetadataView = require('../../../app/views/metadata');
var mockFile = require('../../mocks/models/file');
var mockFileView = require('../../mocks/views/file');

var templates = require('../../../dist/templates');
var $ = require('jquery-browserify');
var _ = require('underscore');

'use strict';

describe('Metadata editor view', function() {

  var metadataEditor;

  beforeEach(function() {
    var $el = $('<div />', {
      id: 'meta',
      html: _.template(templates.metadata)
    }).appendTo($('body'));

    metadataEditor = new MetadataView({
      model: mockFile(),
      titleAsHeading: '',
      view: mockFileView(),
      el: $('#meta')
    });
  });

  afterEach(function() {
    $('#meta').remove();
    if (metadataEditor.remove) {
      metadataEditor.remove();
    }
  });


  describe('creating editor elements', function() {

    // Without any defaults, we should only see the raw meta element
    it('shows a raw editor', function() {
      metadataEditor.render();
      expect( $('#meta').find('.form-item').length ).to.equal(1);
    });

    it('does not append hidden meta elements', function() {
      var model = mockFile();
      model.set('defaults', [{
        name: 'layout',
        field: {
          element: 'hidden',
          value: 'fixed'
        }
      }]);
      metadataEditor.model = model;
      metadataEditor.render();
      expect( $('#meta').find('.form-item').length ).to.equal(1);
    });

    it('autofills default metadata on textarea elements', function() {
      var value = '123';
      var model = mockFile();
      model.set('defaults', [{
        name: 'foo',
        field: {
          element: 'textarea',
          label: 'bar',
          value: value,
        }
      }]);
      metadataEditor.model = model;
      metadataEditor.render();
      expect( metadataEditor.foo.getValue() ).to.equal(value);
    });

    // Metadata object saves references to code-mirror'd textarea elements
    // on itself, or 'this', during render function.
    // This has the potential to overwrite native methods.
    it('textarea names do not collide with view methods', function() {
      var model = mockFile();
      model.set('defaults', [{
        name: 'view',
        field: {
          element: 'textarea',
        }
      }]);
      metadataEditor.model = model;
      metadataEditor.render();
      expect( metadataEditor.view ).to.deep.equal(view);
    });
  });

  describe('saving changes', function() {

    it('saves changes to model on text element change', function() {
      var model = mockFile();
      model.set('defaults', [{
        name: 'foo',
        field: {
          element: 'text',
          value: 'foo'
        }
      }]);
      metadataEditor.model = model;
      metadataEditor.render();

      var newValue = 'bar';
      $('#meta').find('[name="foo"]').val(newValue);
      $('.metafield').trigger('change');
      expect(model.get('metadata').foo).to.equal(newValue);
    });

    it('saves changes to model on textarea element change', function() {
      var model = mockFile();
      model.set('defaults', [{
        name: 'foo',
        field: {
          element: 'textarea',
          value: 'foo',
        }
      }]);
      metadataEditor.model = model;
      metadataEditor.render();

      // Attaching a spy to updateModel lets us know later that
      // our fake DOM manipulation actually triggered the view to update it's model
      var spy = sinon.spy(metadataEditor.updateModel);

      // Set a new value using codemirror api, then focus elsewhere using jQuery.
      var newValue = 'bar'
      metadataEditor.foo.focus();
      metadataEditor.foo.setValue(newValue);
      $('body').focus();

      // Did the view know to update it's model?
      // expect(spy.called);

      expect( model.get('metadata').foo ).to.equal(newValue);
    });
  });
});
