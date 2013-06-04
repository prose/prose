var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  id: 'filter',

  template: _.template(templates.search),

  events: {
    'keyup input': 'search'
  },

  initialize: function(options) {
    this.model = options.model;
    this.view = options.view;
    this.listenTo(this.model, 'reset', this.search, this);
  },

  render: function() {
    this.$el.html(this.template());
    this.input = this.$el.find('input');
    this.input.focus();

    /*
    _.delay(function () {
      utils.fixedScroll($('.topbar'));
    }, 1);
    */

    return this;
  },

  search: function(e) {
    // If this is the ESC key
    if (e.which === 27) {
      _.delay(_.bind(function() {
        this.input.val('');
        this.view.render(this.model);
      }, this), 10);
    } else if (e.which === 40 && $('.item').length > 0) {
        utils.pageListing('down'); // Arrow Down
        e.preventDefault();
        e.stopPropagation();
        this.input.blur();
    } else {
      _.delay(_.bind(function() {
        var searchstr = this.input.val() || '';
        this.view.render(this.model.filter(function(model) {
          return model.get('name').indexOf(searchstr) > -1;
        }));
      }, this), 10);
    }
  }
});
