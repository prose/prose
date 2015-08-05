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
      expect($('#meta').find('.form-item').length).to.equal(1);
    });

    it('creates a text input element with proper default value, label and data-type', function() {
      var model = mockFile();
      model.set('defaults', [{
        name: 'text',
        field: {
          element: 'text',
          value: 'hello world',
          label: 'text label'
        }
      }]);
      metadataEditor.model = model;
      metadataEditor.render();
      var $meta = $('#meta').find('input[type="text"]');
      expect($meta.length).to.equal(1);
      expect($meta.val()).to.equal('hello world');
      expect($meta.data('type')).to.equal('text');
      expect($('#meta').find('label[for="text"]').text()).to.equal('text label');
    });

    it('creates a textarea element with proper default value and label', function() {
      var model = mockFile();
      model.set('defaults', [{
        name: 'foo',
        field: {
          element: 'textarea',
          label: 'bar',
          value: '123'
        }
      }]);
      metadataEditor.model = model;
      metadataEditor.render();
      expect($('#meta').find('label[for="foo"]').text()).to.equal('bar');
      expect(metadataEditor.foo.getValue()).to.equal('123');
    });

    it('creates a select element with proper label and correct options', function() {
      var model = mockFile();
      model.set('defaults', [{
        name: 'select',
        field: {
          element: 'select',
          label: 'select label',
          options: [
            {name: 'Dan', value: 'dan'},
            {name: 'Jon', value: 'jon'},
            {name: 'Sre', value: 'sre'}
          ]
        }
      }]);
      metadataEditor.model = model;
      metadataEditor.render();
      expect($('#meta').find('label[for="select"]').text()).to.equal('select label');
      expect($('#meta').find('ul.chzn-results').find('li').length).to.equal(3);
    });

    it('creates a multiselect element with proper label and correct options', function() {
      var model = mockFile();
      model.set('defaults', [{
        name: 'multiselect',
        field: {
          element: 'multiselect',
          label: 'multiselect label',
          options: [
            {name: 'Dan', value: 'dan'},
            {name: 'Jon', value: 'jon'}
          ]
        }
      }]);
      metadataEditor.model = model;
      metadataEditor.render();
      expect($('#meta').find('label[for="multiselect"]').text()).to.equal('multiselect label');
      expect($('#meta').find('ul.chzn-results').find('li').length).to.equal(2);
    });

    it('creates a checkbox element with proper default value and label', function() {
      var model = mockFile();
      model.set('defaults', [{
        name: 'checkbox',
        field: {
          element: 'checkbox',
          label: 'checkbox label',
          value: false
        }
      }]);
      metadataEditor.model = model;
      metadataEditor.render();
      expect($('#meta').find('input[type="checkbox"]').length).to.equal(1);
      expect($('#meta').find('input[type="checkbox"]:checked').length).to.equal(0);
      expect($('#meta').find('label[for="checkbox"]').text()).to.equal('checkbox label');
    });

    it('creates a number element with proper default value, label, and data-type', function() {
      var model = mockFile();
      model.set('defaults', [{
        name: 'number',
        field: {
          element: 'number',
          label: 'number label',
          value: 4
        }
      }]);
      metadataEditor.model = model;
      metadataEditor.render();
      var $meta = $('#meta').find('input[type="text"]');
      expect($meta.length).to.equal(1);
      expect($meta.val()).to.equal('4');
      expect($meta.data('type')).to.equal('number');
      expect($('#meta').find('label[for="number"]').text()).to.equal('number label');
    });

    it('creates a button element (TODO)', function() {
      // TODO this models broken behavior.
      // https://github.com/prose/prose/issues/859
      var model = mockFile();
      model.set('defaults', [{
        name: 'button',
        field: {
          element: 'button',
          on: 'on',
          off: 'off'
        }
      }]);
      metadataEditor.model = model;
      metadataEditor.render();
      expect($('#meta').find('input[type="button"]').length).to.equal(1);
    });

    it('creates a text element if no field object exists', function() {
      var model = mockFile();
      model.set('defaults', [{
        name: 'shouldBeText'
      }]);
      metadataEditor.model = model;
      metadataEditor.render();
      expect($('#meta').find('input[type="text"]').length).to.equal(1);
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
      expect($('#meta').find('.form-item').length).to.equal(1);
    });

    it('saves defaults that are hidden to metadata', function() {
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
      expect(metadataEditor.model.get('metadata').layout).to.equal('fixed');
    });

    // Metadata object saves references to code-mirror'd textarea elements
    // on itself, or 'this', during render function.
    // This has the potential to overwrite native methods.
    it('textarea names do not collide with view methods (TODO)', function() {
      var model = mockFile();
      model.set('defaults', [{
        name: 'view',
        field: {
          element: 'textarea',
        }
      }]);
      metadataEditor.model = model;
      metadataEditor.render();
      expect( metadataEditor.view).to.deep.equal(view);
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

    it('saves changes to model on textarea element change (TODO)', function() {
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

      expect( model.get('metadata').foo).to.equal(newValue);
    });
  });
});
