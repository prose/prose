var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');

module.exports = Backbone.View.extend({

  id: 'notification',

  initialize: function(type, message) {
    this.model = this.options;
  },

  render: function() {
    var tmpl = _(window.app.templates.notification).template();
    $(this.el).html(tmpl(this.model));
    return this;
  }
});
