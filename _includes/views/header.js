(function(config, models, views, routers, utils, templates) {

views.Header = Backbone.View.extend({
  id: 'header',

  events: {
    "click a.logout": "_logout"
  },

  _logout: function() {
    logout();
    app.instance.render();
    return false;
  },

  initialize: function(options) {
    
  },

  render: function() {
    $(this.el).html(templates.header(_.extend(this.model, {state: app.state})));
    
    return this;
  }
});

}).apply(this, window.args);