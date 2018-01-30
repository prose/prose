var _ = require('lodash');
var $ = require('jquery-browserify');
var HeaderView = require('../../../app/views/header');

var MockFile = require('../../mocks/models/file');
var MockRepo = require('../../mocks/models/repo');

describe('Header view', function() {
  var file = MockFile();
  var repo = MockRepo();
  var _opt = {

    // what shows up in the title field
    // input: 'untitled'

    // whether it's a title (markdown with title default) or a path
    // title: true

    file: file,
    repo: repo,
    alterable: true,

    // true if it's a new file
    placeholder: true
  };
  var options;

  beforeEach(function() {
    var $header = $('<div />', { id: 'header', }).appendTo($('body'));
    options = _.extend({
      el: $header
    }, _opt);
  });

  afterEach(function() {
    $('#header').remove();
  });

  var headerView;

  it('updates metadata to file model on markdown files', function() {
    options.input = '';

    // will signal that it's markdown.
    options.title = true;
    new HeaderView(options).render();
    $('input[data-mode="title"]').val('foo').trigger('change');
    expect(file.get('metadata').title).to.equal('foo');
  });


  it('updates path on file model on non-markdown files', function() {
    options.input = 'some/path/to/where.html';

    options.title = false;
    new HeaderView(options).render();
    $('input[data-mode="path"]').val('another/path.html').trigger('change');
    expect(file.get('path')).to.equal('another/path.html');
  });
});
