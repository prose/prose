var MetadataView = require('../../../app/views/metadata');
var mockFile = require('../../mocks/models/file');
var mockFileView = require('../../mocks/views/file');

var templates = require('../../../dist/templates');
var $ = require('jquery-browserify');
var _ = require('underscore');
var jsyaml = require('js-yaml');

'use strict';

describe('Metadata editor view', function() {

  var metadataEditor;

  var model;
  beforeEach(function() {
    $('<div />', {
      id: 'meta',
      html: _.template(templates.metadata)
    }).appendTo($('body'));

    model = mockFile();
    metadataEditor = new MetadataView({
      model: model,
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

    it('creates a text input element with default value, label and data-type', function() {
      model.set('defaults', [{
        name: 'text',
        field: {
          element: 'text',
          value: 'hello world',
          label: 'text label'
        }
      }]);
      metadataEditor.render();
      var $meta = $('#meta').find('input[type="text"]');
      expect($meta.length).to.equal(1);
      expect($meta.val()).to.equal('hello world');
      expect($meta.data('type')).to.equal('text');
      expect($('#meta').find('label[for="text"]').text()).to.equal('text label');
    });

    it('creates a textarea element with default value and label', function() {
      model.set('defaults', [{
        name: 'foo',
        field: {
          element: 'textarea',
          label: 'bar',
          value: '123'
        }
      }]);
      metadataEditor.render();
      expect($('#meta').find('label[for="foo"]').text()).to.equal('bar');
      expect(metadataEditor.foo.getValue()).to.equal('123');
    });

    it('creates a select element with correct label and options', function() {
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
      metadataEditor.render();
      expect($('#meta').find('label[for="select"]').text()).to.equal('select label');
      expect($('#meta').find('ul.chzn-results').find('li').length).to.equal(3);
    });

    it('creates a multiselect element with correct label and options', function() {
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
      metadataEditor.render();
      expect($('#meta').find('label[for="multiselect"]').text()).to.equal('multiselect label');
      expect($('#meta').find('ul.chzn-results').find('li').length).to.equal(2);
    });

    it('creates a checkbox element with default value and label', function() {
      model.set('defaults', [{
        name: 'checkbox',
        field: {
          element: 'checkbox',
          label: 'checkbox label',
          value: false
        }
      }]);
      metadataEditor.render();
      expect($('#meta').find('input[type="checkbox"]').length).to.equal(1);
      expect($('#meta').find('input[type="checkbox"]:checked').length).to.equal(0);
      expect($('#meta').find('label[for="checkbox"]').text()).to.equal('checkbox label');
    });

    it('creates a number element with default value, label, and data-type', function() {
      model.set('defaults', [{
        name: 'number',
        field: {
          element: 'number',
          label: 'number label',
          value: 4
        }
      }]);
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
      model.set('defaults', [{
        name: 'button',
        field: {
          element: 'button',
          on: 'on',
          off: 'off'
        }
      }]);
      metadataEditor.render();
      expect($('#meta').find('input[type="button"]').length).to.equal(1);
    });

    it('creates a text element if no field object exists', function() {
      model.set('defaults', [{
        name: 'shouldBeText'
      }]);
      metadataEditor.render();
      expect($('#meta').find('input[type="text"]').length).to.equal(1);
    });

    it('does not append hidden meta elements', function() {
      model.set('defaults', [{
        name: 'layout',
        field: {
          element: 'hidden',
          value: 'fixed'
        }
      }]);
      metadataEditor.render();
      expect($('#meta').find('.form-item').length).to.equal(1);
    });

    it('saves defaults that are hidden to metadata', function() {
      model.set('defaults', [{
        name: 'layout',
        field: {
          element: 'hidden',
          value: 'fixed'
        }
      }]);
      metadataEditor.render();
      expect(metadataEditor.model.get('metadata').layout).to.equal('fixed');
    });

    // Metadata object saves references to code-mirror'd textarea elements
    // on itself, or 'this', during render function.
    // This has the potential to overwrite native methods.
    it('textarea names do not collide with view methods (TODO)', function() {
      model.set('defaults', [{
        name: 'view',
        field: {
          element: 'textarea',
        }
      }]);
      metadataEditor.render();
      expect( metadataEditor.view).to.deep.equal(view);
    });
  });


  describe('getting values from form elements', function() {
    // Although there are separate tests for getting values from each meta element individually,
    // this one is more about the ability of this one to save values to a metadata object.

    it('saves changes to model on change to a text input', function() {
      model.set('defaults', [{
        name: 'foo',
        field: {
          element: 'text',
          value: 'foo'
        }
      }]);
      metadataEditor.render();

      var newValue = 'bar';
      $('#meta').find('[name="foo"]').val(newValue);
      $('.metafield').trigger('change');
      expect(model.get('metadata').foo).to.equal(newValue);
    });

    it('saves changes to model on textarea blur (TODO)', function() {
      model.set('defaults', [{
        name: 'textarea',
        field: {
          element: 'textarea',
          value: 'foo',
        }
      }]);
      metadataEditor.render();
      metadataEditor.textarea.setValue('bar');
      $('.metafield').trigger('change');
      expect(model.get('metadata').textarea).to.equal('bar');
    });

    it('saves changes to model on checkboxes', function() {
      model.set('defaults', [{
        name: 'checkbox',
        field: {
          element: 'checkbox',
          label: 'checkbox label',
          value: false
        }
      }]);
      metadataEditor.render();
      var $input = $('#meta').find('input[name="checkbox"]');
      $input[0].checked = true;
      $input.trigger('change');
      expect(model.get('metadata').checkbox).to.equal(true);
    });

    it('saves changes to model on selects', function() {
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
      metadataEditor.render();
      var $select = $('#meta').find('select');
      $select[0].selectedIndex=1;
      $select.trigger('liszt:updated').trigger('change');
      expect(model.get('metadata').select).to.equal('jon');
    });

    it('saves changes to model on multiselects', function() {
      model.set('defaults', [{
        name: 'select',
        field: {
          element: 'multiselect',
          label: 'multiselect label',
          options: [
            {name: 'Dan', value: 'dan'},
            {name: 'Jon', value: 'jon'},
            {name: 'Sre', value: 'sre'}
          ]
        }
      }]);
      metadataEditor.render();
      var $select = $('#meta').find('select');
      $select[0].selectedIndex=2;
      $select.trigger('liszt:updated').trigger('change');
      expect(model.get('metadata').select[0]).to.equal('sre');
    });

    it('saves number fields as numbers', function() {
      model.set('defaults', [{
        name: 'number',
        field: {
          element: 'number',
          label: 'number label',
          value: 4
        }
      }]);
      metadataEditor.render();
      var $input = $('#meta').find('input[name="number"]')
      $input.val(6);
      $input.trigger('change');
      expect(model.get('metadata').number).to.equal(6);
    });

    // TODO no point creating a button test as it work yet.
  });

  describe('setting defaults on load', function() {
    it('sets values on text elements', function() {
      model.set('defaults', [{
        name: 'text',
        field: {
          element: 'text'
        }
      }]);
      model.set('metadata', {
        text: 'abc'
      });
      metadataEditor.render();
      expect($('#meta').find('input[name="text"]').val()).to.equal('abc');
    });

    it('sets values on textarea elements', function() {
      model.set('defaults', [{
        name: 'textarea',
        field: {
          element: 'textarea'
        }
      }]);
      model.set('metadata', {
        textarea: 'abc'
      });
      metadataEditor.render();
      expect(metadataEditor.textarea.getValue()).to.equal('abc');
    });

    it('sets values on select elements', function() {
      model.set('defaults', [{
        name: 'select',
        field: {
          element: 'select',
          options: [
            {name: 'Dan', value: 'dan'},
            {name: 'Jon', value: 'jon'},
            {name: 'Sre', value: 'sre'}
          ]
        }
      }]);
      model.set('metadata', {
        select: 'jon'
      });
      metadataEditor.render();
      expect($('#meta').find('select').val()).to.equal('jon');
    });

    it('sets values on multiselect elements', function() {
      model.set('defaults', [{
        name: 'multiselect',
        field: {
          element: 'multiselect',
          options: [
            {name: 'Dan', value: 'dan'},
            {name: 'Jon', value: 'jon'},
            {name: 'Sre', value: 'sre'}
          ]
        }
      }]);
      model.set('metadata', {
        multiselect: ['jon','sre']
      });
      metadataEditor.render();
      expect($('#meta').find('select').val()).to.deep.equal(['jon','sre']);
    });

    it('sets values on checkbox elements', function() {
      model.set('defaults', [{
        name: 'checkbox',
        field: {
          element: 'checkbox',
          value: false
        }
      }]);
      model.set('metadata', {
        checkbox: true
      });
      metadataEditor.render();
      expect($('#meta').find('input[name="checkbox"]')[0].checked).to.equal(true);
    });

    it('puts metadata without defaults into the raw editor', function() {
      model.set('defaults', []);
      model.set('metadata', {
        text: 'hello world'
      });
      metadataEditor.render();
      expect(jsyaml.safeLoad(metadataEditor.rawEditor.getValue()))
        .to.deep.equal({text: 'hello world'});
    });

    it('does not put title, publish, or hidden elements into the raw editor', function() {
      model.set('defaults', [{
        name: 'layout',
        field: {
          element: 'hidden',
          value: 'page'
        }
      }]);
      model.set('metadata', {
        published: true,
        title: 'hello world'
      });
      metadataEditor.render();
      expect(metadataEditor.rawEditor.getValue()).to.equal('');
    });

    it('handles text elements with duplicate names', function() {
      model.set('defaults', [{
        name: 'text',
        field: {
          element: 'text',
        }
      },{
        name: 'text',
        field: {
          element: 'text',
        }
      }]);
      model.set('metadata', {
        text: ['hello', 'world']
      });
      metadataEditor.render();
      expect(model.get('metadata').text).to.deep.equal(['hello', 'world']);
    });
  });

});
