var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  className: 'modal overlay',

  template: templates.modal,

  events: {
    'click .got-it': 'confirm'
  },

  initialize: function() {
    this.message = this.options.message;
  },

  render: function() {
    var modal = {
      message: this.message
    };
    this.$el.empty().append(_.template(templates.modal, modal, {
      variable: 'modal'
    }));

    return this;
  },

  confirm: function() {
    var view = this;
    this.$el.fadeOut('fast', function() {
      view.remove();
    });
    return false;
  }
});
