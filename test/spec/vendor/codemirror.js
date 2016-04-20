var CodeMirror = require('codemirror');
var $ = require('jquery-browserify');
var View = require('backbone').View;

// Useful for us to know what parts of the CodeMirror API we use,
// and what parts change between major versions.
describe('CodeMirror integration', function () {
  var $el;

  beforeEach(function () {
    $el = $('<div />', {
      name: 'raw',
      id: 'raw',
      class: 'metafield inner'
    }).appendTo('body');
  });

  afterEach(function () {
    $el.remove();
  });

  it('Creates a basic instance with standard API', function (done) {
    // init
    var cm = CodeMirror($el[0]);
    expect(cm.isClean()).ok;
    expect($el.find('.CodeMirror').length).ok;

    // setValue, getValue
    var str = '1 is the loneliest number';
    cm.setValue(str);
    expect(cm.getValue()).eql(str);
    expect(cm.isClean()).not.ok;

    // blur event
    var i = 0;
    cm.on('blur', function () {
      i += 1;
      expect(i === 1).ok;
    });
    cm.on('focus', function () {
      i += 1;
      expect(i === 2).ok;
      done();
    });
    CodeMirror.signal(cm, 'blur');
    CodeMirror.signal(cm, 'focus');
  });

  it('Works using replacement function', function (done) {
    // attach id, classname, and data-attribute
    // using the replacement function syntax
    var cm = CodeMirror(function (el) {
      var $child = $('<div/>').appendTo($el);
      $el[0].replaceChild(el, $child[0]);
      el.id = 'foo';
      el.className += ' bar';
      el.setAttribute('data-name', 'baz');
    });
    var $cm = $el.find('.CodeMirror');
    expect($cm.length).ok;
    expect($cm.attr('id')).eql('foo');
    expect(/bar/.test($cm.attr('class'))).ok;
    expect($cm.attr('data-name')).eql('baz');
    done();
  });

  // TODO test rawKeyMap option
  it('Takes arguments', function (done) {
    var value = 'This isn\'t your mother.';
    var keymap = {
      'Ctrl-S': done
    };
    var cm = CodeMirror($el[0], {
      mode: 'yaml',
      value: value,
      lineNumbers: true,
      lineWrapping: true,
      rawKeyMap: keymap,
      theme: 'prose-bright'
    });
    var $cm = $el.find('.CodeMirror');
    expect(cm.getValue()).eql(value);

    // theme
    expect(/prose-bright/.test($cm.attr('class'))).ok;

    // line numbers
    expect($cm.find('.CodeMirror-linenumber').length).ok;

    done();
    // $('body').trigger('Ctrl-S');
  });

  it('#fromTextArea', function (done) {
    var str = 'pre-existing string';
    var $txt = $('<textarea />', {
      text: str
    }).appendTo($el);
    var cm = CodeMirror.fromTextArea($txt[0]);
    expect(cm.getValue()).eql(str);
    expect($el.find('.CodeMirror').length).ok;
    done();
  });

  it('triggers events', function (done) {
    var cm = CodeMirror($el[0]);
    var view = new View();
    var map = {};
    function setProp(prop) {
      return function () {
        map[prop] = true
      }
    }
    view.listenTo(cm, 'cursorActivity', setProp('cursor'));
    view.listenTo(cm, 'change', setProp('change'));
    view.listenTo(cm, 'focus', setProp('focus'));
    CodeMirror.signal(cm, 'focus');
    cm.setValue('Incredible Hulk');
    expect(map.cursor).ok;
    expect(map.change).ok;
    expect(map.focus).ok;
    done();
  });

  it('honors selections', function () {
    var cm = CodeMirror($el[0]);
    cm.setValue('foo');
    cm.execCommand('selectAll');
    expect(cm.getSelection()).eql('foo');
    cm.replaceSelection('bar');
    expect(cm.getValue()).eql('bar');
  });
});
