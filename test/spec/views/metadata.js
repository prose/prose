var MetadataView = require('../../../app/views/metadata');
var mockFile = require('../../mocks/models/file');
var mockFiles = require('../../mocks/collections/files')
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
    var fileView = mockFileView();
    metadataEditor = new MetadataView({
      model: model,
      titleAsHeading: fileView.titleAsHeading(),
      view: fileView,
      media: mockFiles(),
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
      expect(metadataEditor.codeMirrorInstances.foo.getValue()).to.equal('123');
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

    it('creates a button element that defaults to on (true)', function() {
      model.set('defaults', [{
        name: 'button',
        field: {
          element: 'button',
          on: 'on',
          off: 'off'
        }
      }]);
      metadataEditor.render();
      var $button = $('#meta').find('[name="button"]');
      expect($button.length).to.equal(1);
      expect($button.val()).to.equal('on');
      expect($button.text()).to.equal('on');
    });

    it('creates an image element with correct label and options', function() {
      model.set('defaults', [{
        name: 'image',
        field: {
          element: 'image',
          label: 'image label',
          value: '/path/to/image.jpg'
        }
      }]);
      metadataEditor.render();
      expect($('#meta').find('label[for="image"]').text()).to.equal('image label');
      var $meta = $('#meta').find('input[name="image"]');
      expect($meta.val()).to.equal('/path/to/image.jpg');
    });

    it('creates an image element that spawns a dialog when clicked', function() {
        model.set('defaults', [{
        name: 'image',
        field: {
          element: 'image',
          label: 'image label',
          value: '/path/to/image.jpg'
        }
      }]);
      metadataEditor.render();
      var $button = $('#meta').find('a[data-select="image"]');
      $button.click();
      var $dialog = $('#meta').find('div.dialog');
      expect($dialog.length).to.equal(1);
      expect($dialog.find('input[name="url"]').length).to.equal(1);
      expect($dialog.find('a[data-type="media"]').length).to.equal(1);
    });

    it('creates an image element that spawns and destroys a dialog when clicked twice', function() {
        model.set('defaults', [{
        name: 'image',
        field: {
          element: 'image',
          label: 'image label',
          value: '/path/to/image.jpg'
        }
      }]);
      metadataEditor.render();
      var $button = $('#meta').find('a[data-select="image"]');
      $button.click();
      var $dialog = $('#meta').find('div.dialog');
      $button.click();
      expect($dialog.hasClass('dialog')).to.be.false;
      expect($dialog.find('input[name="url"]').length).to.equal(0);
      expect($dialog.find('a[data-type="media"]').length).to.equal(0);
    });

    it('creates an image element that spawns, destroys, and spawns again a dialog when clicked thrice', function() {
        model.set('defaults', [{
        name: 'image',
        field: {
          element: 'image',
          label: 'image label',
          value: '/path/to/image.jpg'
        }
      }]);
      metadataEditor.render();
      var $button = $('#meta').find('a[data-select="image"]');
      $button.click();
      var $dialog = $('#meta').find('div.dialog');
      $button.click();
      $button.click();
      expect($dialog.length).to.equal(1);
      expect($dialog.find('input[name="url"]').length).to.equal(1);
      expect($dialog.find('a[data-type="media"]').length).to.equal(1);
    });

    it('creates two image elements, but only one dialog at a time', function() {
        model.set('defaults', [{
        name: 'image1',
        field: {
          element: 'image',
          label: 'image label',
          value: '/path/to/image1.jpg'
        }
      }, {
        name: 'image2',
        field: {
          element: 'image',
          label: 'image2 label',
          value: '/path/to/image2.jpg'
        }
      }]);
      metadataEditor.render();
      var $button1 = $('#meta').find('a[data-select="image1"]');
      $button1.click();
      var $dialog1 = $button1.parents('div.form-item').find('div.dialog');
      var $button2 = $('#meta').find('a[data-select="image2"]');
      $button2.click();
      var $dialog2 = $button2.parents('div.form-item').find('div.dialog');
      // Dialog 1 should disappear, Dialog 2 should appear
      expect($dialog1.hasClass('dialog')).to.be.false;
      expect($dialog1.find('input[name="url"]').length).to.equal(0);
      expect($dialog1.find('a[data-type="media"]').length).to.equal(0);
      expect($dialog2.hasClass('dialog')).to.be.true;
      expect($dialog2.find('input[name="url"]').length).to.equal(1);
      expect($dialog2.find('a[data-type="media"]').length).to.equal(1);
    });

    it('creates an image element, and the dialog affects the element', function() {
        model.set('defaults', [{
        name: 'image',
        field: {
          element: 'image',
          label: 'image label',
          value: '/path/to/image.jpg'
        }
      }]);
      metadataEditor.render();
      var $button = $('#meta').find('a[data-select="image"]');
      $button.click();
      var $dialog = $button.parents('div.form-item').find('div.dialog');
      var $urlinput = $dialog.find('input[name="url"]');
      var newimage = 'path/to/newimage.jpg';
      $urlinput.val(newimage);
      var $insert = $dialog.find('a[data-type="media"]');
      expect($urlinput.val()).to.equal(newimage);
      $insert.click();
      var $meta = $('#meta').find('input[name="image"]');
      expect($meta.val()).to.equal(newimage);
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

    it('saves multiple hidden elements to metadata', function() {
      model.set('defaults', [{
        name: 'layout',
        field: {
          element: 'hidden',
          value: 'fixed'
        }
      },
      {
        name: 'published',
        field: {
          element: 'hidden',
          value: true
        }
      }]);
      metadataEditor.render();
      expect(metadataEditor.model.get('metadata').layout).to.equal('fixed');
      expect(metadataEditor.model.get('metadata').published).to.equal(true);
    });

    it('does not crap out on hidden metadata with no defaults', function() {
      model.set('defaults', [{
        name: 'layout',
        field: {
          element: 'hidden'
        }
      }]);
      metadataEditor.render();
      var values = metadataEditor.getValue();
      expect(values.hasOwnProperty('layout')).not.ok;
    });

    it('does not remove title and published meta properties, even if they are unset', function () {
      model.set('metadata', {
        title: '',
        published: ''
      });
      metadataEditor.render();
      var values = metadataEditor.getValue();
      expect(values.hasOwnProperty('title')).ok;
      expect(values.hasOwnProperty('published')).ok;
    });

    it('textarea names do not collide with view methods', function() {
      var view = metadataEditor.view;
      model.set('defaults', [{
        name: 'view',
        field: {
          element: 'textarea',
        }
      }]);
      metadataEditor.render();
      expect(metadataEditor.view).to.deep.equal(view);
    });
  });

  describe('testing user input from form elements', function() {
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

    it('saves changes to model on textarea blur', function() {
      model.set('defaults', [{
        name: 'textarea',
        field: {
          element: 'textarea',
          value: 'foo',
        }
      }]);
      metadataEditor.render();
      metadataEditor.codeMirrorInstances.textarea.setValue('bar');
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

    it('saves button values as boolean, defaulting to true', function() {
      model.set('defaults', [{
        name: 'button',
        field: {
          element: 'button',
          on: 'on',
          off: 'off'
        }
      }]);
      metadataEditor.render();
      var $button = $('#meta').find('[name="button"]');
      expect(model.get('metadata').button).to.equal(true);
      $button.trigger('click');
      expect(model.get('metadata').button).to.equal(false);
    });

    it('saves changes to model on change to an image input', function() {
      model.set('defaults', [{
        name: 'image',
        field: {
          element: 'image',
          label: 'image label',
          value: '/path/to/image.jpg'
        }
      }]);
      metadataEditor.render();

      var newValue = '/path/to/newimage.jpg';
      $('#meta').find('input[name="image"]').val(newValue);
      $('.metafield').trigger('change');
      expect(model.get('metadata').image).to.equal(newValue);
    });

    it('does not error when titleAsHeading is true and no title is defined on metadata', function() {
      model.set('metadata', {
        title: null
      });
      metadataEditor.titleAsHeading = true;
      metadataEditor.render();
      expect(metadataEditor).to.be.ok;
    });
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
      expect(metadataEditor.codeMirrorInstances.textarea.getValue()).to.equal('abc');
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

    it('sets values on image elements', function() {
      model.set('defaults', [{
        name: 'image',
        field: {
          element: 'image',
          label: 'image label',
          value: '/path/to/image.jpg'
        }
      }]);
      model.set('metadata', {
        image: '/path/to/image2.jpg'
      });
      metadataEditor.render();
      expect($('#meta').find('input[name="image"]').val()).to.equal('/path/to/image2.jpg');
    });

    it('puts metadata without defaults into the raw editor', function() {
      model.set('defaults', []);
      model.set('metadata', {
        text: 'hello world'
      });
      metadataEditor.render();
      expect(jsyaml.safeLoad(metadataEditor.codeMirrorInstances.rawEditor.getValue()))
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
      expect(metadataEditor.codeMirrorInstances.rawEditor.getValue()).to.equal('');
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

    it('adds options to selects from metadata when none exists in defaults', function() {
      model.set('defaults', [{
        name: 'select',
        field: {
          element: 'select',
          options: []
        }
      }]);
      model.set('metadata', {
        select: 'foo'
      });
      metadataEditor.render();
      expect($('#meta').find('select').find('option').length).to.equal(1);
      expect(model.get('metadata').select).to.equal('foo');
    });

    it('adds options to multiselects from metadata when none exists in defaults', function() {
      model.set('defaults', [{
        name: 'multiselect',
        field: {
          element: 'multiselect',
          options: []
        }
      }]);
      model.set('metadata', {
        multiselect: ['foo', 'bar']
      });
      metadataEditor.render();
      expect($('#meta').find('select').find('option').length).to.equal(2);
      expect(model.get('metadata').multiselect).to.deep.equal(['foo', 'bar']);
    });

    it('removes meta values that are empty strings from text fields', function () {
      model.set('defaults', [{
        name: 'false',
        field: {
          element: 'text',
          value: 'false'
        }
      }, {
        name: 'null',
        field: {
          element: 'text',
          value: 'null'
        }
      }, {
        name: 'numerical zero',
        field: {
          element: 'text',
          value: 0
        }
      }, {
        name: 'empty string',
        field: {
          element: 'text',
          value: ''
        }
      }]);
      metadataEditor.render();
      expect(model.get('metadata').hasOwnProperty('false')).ok;
      expect(model.get('metadata').hasOwnProperty('null')).ok;
      expect(model.get('metadata').hasOwnProperty('numerical zero')).ok;
      expect(model.get('metadata').hasOwnProperty('empty string')).not.ok;
    });

    it('removes meta values that are empty strings from textarea fields', function () {
      model.set('defaults', [{
        name: 'false',
        field: {
          element: 'textarea',
          value: 'false'
        }
      }, {
        name: 'null',
        field: {
          element: 'textarea',
          value: 'null'
        }
      }, {
        name: 'numerical zero',
        field: {
          element: 'textarea',
          value: 0
        }
      }, {
        name: 'empty string',
        field: {
          element: 'textarea',
          value: ''
        }
      }]);
      metadataEditor.render();
      // textareas behave differently, parsing is done by codemirror
      // and jsyaml, so we have less control over the outcome.
      expect(model.get('metadata').hasOwnProperty('false')).not.ok;
      expect(model.get('metadata').hasOwnProperty('null')).not.ok;
      expect(model.get('metadata').hasOwnProperty('numerical zero')).ok;
      expect(model.get('metadata').hasOwnProperty('empty string')).not.ok;
    });

    it('removes empty string values that are not defaults', function () {
      model.set('metadata', {
        notExist: '',
        shouldExist: false
      });
      metadataEditor.render();
      expect(model.get('metadata').hasOwnProperty('shouldExist')).ok;
      expect(model.get('metadata').hasOwnProperty('notExist')).not.ok;
    });
  });
});
