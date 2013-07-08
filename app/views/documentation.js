var $ = require('jquery-browserify');
var marked = require('marked');
var Backbone = require('backbone');

module.exports = Backbone.View.extend({
  className: 'inner deep prose limiter',

  render: function() {
    this.$el.empty()
      .append(marked(t('about.content')));
    return this;
  }
});
