(function(config, models, views, routers, utils, templates) {

views.Notification = Backbone.View.extend({
  
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

}).apply(this, window.args);