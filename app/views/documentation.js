var $ = require('jquery-browserify');
var marked = require('marked');
var Backbone = require('backbone');

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


