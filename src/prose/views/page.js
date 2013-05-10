var $ = require('jquery-browserify');
var chosen = require('chosen-jquery-browserify');
var _ = require('underscore');
var jsyaml = require('js-yaml');
var key = require('keymaster');
var marked = require('marked');
var diff = require('diff');
var Backbone = require('backbone');
var utils = require('.././util');

module.exports = Backbone.View.extend({
  className: 'inner deep prose',
  render: function() {
    var view = this;
    $.get('about.md', function(d) {
      view.$el.html(marked(d));
    });
    return this;
  }
});


