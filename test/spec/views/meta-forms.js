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

    it('reads values from a button element (TODO)', function() {
      // This test is broken because the button element is broken.
      // https://github.com/prose/prose/issues/859
      data.field.on = 'on';
      data.field.off = 'off';
      var button = new Button({data: data});
      $('#meta').append(button.render());
      expect(button.getValue()).to.equal('on');
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
  });
});
