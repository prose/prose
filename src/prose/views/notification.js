var $ = require('jquery-browserify');
var Backbone = require('backbone');

module.exports = Backbone.View.extend({

  id: 'notification',

  initialize: function(type, message) {
    this.model = {};
    this.model.type = type;
    this.model.message = message;
  },

  render: function() {
    var tmpl = _(window.app.templates.notification).template();
    $(this.el).html(tmpl(this.model));
    return this;
  }
});
