var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');
var util = require('../util');

module.exports = Backbone.View.extend({
  template: templates.search,

  events: {
    'keyup input': 'keyup'
  },

  initialize: function(options) {
    this.mode = options.mode;
    this.model = options.model;
  },

  render: function() {
    var placeholder = t('main.repos.filter');
    if (this.mode === 'repo') placeholder = t('main.repo.filter');

    var search = {
      placeholder: placeholder
    };

    this.$el.empty().append(_.template(this.template, search, {
      variable: 'search'
    }));

    this.input = this.$el.find('input');
    this.input.focus();
    return this;
  },

  keyup: function(e) {
    if (e && e.which === 27) {
      // ESC key
      this.input.val('');
      this.trigger('search');
    } else if (e && e.which === 40) {
      // Down Arrow
      util.pageListing('down');
      e.preventDefault();
      e.stopPropagation();
      this.input.blur();
    } else {
      this.trigger('search');
    }
  },

  search: function() {
    var searchstr = this.input ? this.input.val() : '';
    return this.model.filter(function(model) {
      return model.get('name').indexOf(searchstr) > -1;
    });
  }
});
