var $ = require('jquery-browserify');
var _ = require('underscore');
var chosen = require('chosen-jquery-browserify');

var Checkbox = require('../../../app/views/meta/checkbox');
var TextForm = require('../../../app/views/meta/text');
var TextArea = require('../../../app/views/meta/textarea');
var Button = require('../../../app/views/meta/button');
var Select = require('../../../app/views/meta/select');
var Multiselect = require('../../../app/views/meta/multiselect');

'use strict';

var sampleData = {
  name: 'foo',
  field: {
    label: 'foo label',
    help: 'foo help',
  }
}

describe('Metadata form elements', function() {

  // Convenient way to give us a new data object
  // to work with for each test.
  var data;
  beforeEach(function() {
    data = _.extend({}, sampleData);
    $('<div />', {id: 'meta'}).appendTo($('body'));
  });

  afterEach(function() {
    $('#meta').remove();
  });

  describe('Reading values', function() {
    it('returns empty strings for null', function () {
      [TextForm, TextArea, Select, Multiselect].forEach(function (View) {
        var view = new View({data: {
          field: {}
        }});
        view.render();
        expect(view.getValue()).to.equal('');
      });
    });

    it('reads values from a text element', function() {
      data.type = 'text';
      var text = new TextForm({data: data});
      $('#meta').append(text.render());
      $('[name="foo"]').val('bar');
      expect(text.getValue()).to.equal('bar');
    });

    it('reads values from a text area element', function() {
      data.field.value = 'bar';
      data.id = 'baz';
      var textarea = new TextArea({data: data});
      $('#meta').append(textarea.render());
      textarea.initCodeMirror(function() {});
      expect(textarea.getValue()).to.equal('bar');
    });

    it('does not endlessly escape text areas', function() {
      var value = '\<script\>alert("hi");\</script\>';
      data.field.value = '';
      data.id = 'xss';
      var textarea = new TextArea({data: data});
      $('#meta').append(textarea.render());
      textarea.initCodeMirror(function() {});
      textarea.setValue(value);
      expect(textarea.getValue()).to.equal(value);
    });

    it('does not treat colons as key-value fields', function() {
      var value = 'ok: this: that:';
      data.field.value = value;
      data.id = 'baz';
      var textarea = new TextArea({data: data});
      $('#meta').append(textarea.render());
      textarea.initCodeMirror(function() {});
      expect(textarea.getValue()).to.equal(value);
    })

    it('reads values from a number element', function() {
      data.type = 'number';
      var number = new TextForm({data: data});
      $('#meta').append(number.render());
      $('[name="foo"]').val(5);
      expect(number.getValue()).to.equal(5);
    });

    it('reads values from a checkbox element', function() {
      data.field.value = false;
      var checkbox = new Checkbox({data: data});
      $('#meta').append(checkbox.render());
      expect(checkbox.getValue()).to.equal(false);
    });

    it('reads values from a button element, and sets values', function() {
      data.field.on = 'foo';
      data.field.off = 'bar';
      var button = new Button({data: data});
      $('#meta').append(button.render());
      expect(button.getValue()).to.equal(true);
      button.setValue('bar');
      expect(button.getValue()).to.equal(false);
    });

    it('sets values on button element to false if outside of bounds', function() {
      data.field.on = 'foo';
      data.field.off = 'bar';
      var button = new Button({data: data});
      $('#meta').append(button.render());
      button.setValue('baz');
      expect(button.getValue()).to.equal(false);
    });

    it('reads values from a select element', function() {
      data.field.options = [
        {name: 'Dan', value: 'dan'},
        {name: 'Jon', value: 'jon'},
        {name: 'Sre', value: 'sre'}
      ];
      var select = new Select({data: data});
      $('#meta').append(select.render());
      $('.chzn-select').chosen();

      var $select = select.$form;
      $select[0].selectedIndex=2;
      $select.trigger('liszt:updated');
      expect(select.getValue()).to.equal('sre');
    });

    it('sets initial value on a select element', function () {
      data.field.options = [
        {name: 'Dan', value: 'dan'},
        {name: 'Jon', value: 'jon'},
        {name: 'Sre', value: 'sre'}
      ];
      var select = new Select({data: data});
      $('#meta').append(select.render());
      $('.chzn-select').chosen();
      select.setValue('jon');
      expect(select.getValue()).to.equal('jon');
      expect($('.chzn-single').find('span').text()).to.equal('Jon');
    });

    it('adds additional, selected element when needed', function () {
      data.field.options = [
        {name: 'Dan', value: 'dan'},
        {name: 'Jon', value: 'jon'},
        {name: 'Sre', value: 'sre'}
      ];
      var select = new Select({data: data});
      $('#meta').append(select.render());
      $('.chzn-select').chosen();
      select.setValue('WUT');
      expect(select.getValue()).to.equal('WUT');
      expect($('.chzn-single').find('span').text()).to.equal('WUT');
    });

    it('shows first item in select, if given an array', function () {
      data.field.options = [
        {name: 'Dan', value: 'dan'},
        {name: 'Jon', value: 'jon'},
        {name: 'Sre', value: 'sre'}
      ];
      var select = new Select({data: data});
      $('#meta').append(select.render());
      $('.chzn-select').chosen();
      select.setValue(['sre', 'jon']);
      expect(select.getValue()).to.equal('sre');
      expect($('.chzn-single').find('span').text()).to.equal('Sre');
    });

    it('reads values from a multiselect element', function() {
      data.field.options = [
        {name: 'Dan', value: 'dan'},
        {name: 'Jon', value: 'jon'},
        {name: 'Sre', value: 'sre'}
      ];
      var multiselect = new Multiselect({data: data});
      $('#meta').append(multiselect.render());
      $('.chzn-select').chosen();

      var $select = multiselect.$form;
      $select[0].selectedIndex=1;
      $select.trigger('liszt:updated');
      expect(multiselect.getValue()[0]).to.equal('jon');
    });

    it('does not set a null value', function () {
      data.field.options = [
        {name: 'Dan', value: 'dan'},
        {name: 'Jon', value: 'jon'},
        {name: 'Sre', value: 'sre'}
      ];
      var multiselect = new Multiselect({data: data});
      $('#meta').append(multiselect.render());
      $('.chzn-select').chosen();
      multiselect.setValue([null, false, undefined]);
      expect($('.chzn-choices').find('li.search-choice').length).to.equal(0);

      // expect response to be an array
      expect(multiselect.getValue()).to.equal('');
    });

    it('accepts a value or an array', function () {
      data.field.options = [
        {name: 'Dan', value: 'dan'},
        {name: 'Jon', value: 'jon'},
        {name: 'Sre', value: 'sre'}
      ];
      var multiselect = new Multiselect({data: data});
      $('#meta').append(multiselect.render());
      $('.chzn-select').chosen();
      multiselect.setValue('sre');
      expect(multiselect.getValue()).to.deep.equal(['sre']);
      multiselect.setValue(['sre', 'jon']);
      expect(multiselect.getValue()).to.deep.equal(['jon', 'sre']);
    });

    it('adds new values when needed', function () {
      data.field.options = [
        {name: 'Dan', value: 'dan'},
        {name: 'Jon', value: 'jon'},
        {name: 'Sre', value: 'sre'}
      ];
      var multiselect = new Multiselect({data: data});
      $('#meta').append(multiselect.render());
      $('.chzn-select').chosen();
      multiselect.setValue(['dick', 'van', 'dyke']);
      expect(multiselect.getValue()).to.deep.equal(['dick', 'van', 'dyke']);
      expect($('.chzn-choices').find('li.search-choice').length).to.equal(3);
      expect($('.chzn-choices').find('li.search-choice').eq(2).find('span').text()).to.equal('dyke');
    });
  });
});
