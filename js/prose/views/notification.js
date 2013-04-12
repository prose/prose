var Backbone = require('backbone');
var $ = require('jquery-browserify');

module.exports = Backbone.View.extend({
  
  id: 'notification',

  initialize: function(type, message) {
    this.model = {};
    this.model.type = type;
    this.model.message = message;
  },

  render: function() {
    $(this.el).html(templates.notification(this.model));
    return this;
  }
});
