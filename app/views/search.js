var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.search),

  events: {
    'keyup input': 'keyup'
  },

  initialize: function(options) {
    this.model = options.model;
  },

  render: function() {
    this.$el.html(this.template());

    this.input = this.$el.find('input');
    this.input.focus();

    return this;
  },

  keyup: function(e) {
    // If this is the ESC key
    if (e && e.which === 27) {
      this.input.val('');
      this.trigger('search');
    } else if (e && e.which === 40 && $('.item').length > 0) {
      utils.pageListing('down'); // Arrow Down
      e.preventDefault();
      e.stopPropagation();
      this.input.blur();
    } else {
      this.trigger('search');
    }
  },

  search: function() {
    var searchstr = this.input.val() || '';
    return this.model.filter(function(model) {
      return model.get('name').indexOf(searchstr) > -1;
    });
  }
});
