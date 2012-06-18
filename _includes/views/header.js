(function(config, models, views, routers, utils, templates) {

views.Header = Backbone.View.extend({
  id: 'header',

  events: {
    "click #mobile-menu a.title": "_mobileMenu",
    "click a.logout": "_logout"
  },

  _mobileMenu: function(e) {
    e.preventDefault();
    $(e.currentTarget).parent().toggleClass('active');

    return false;
  },

  _logout: function() {
    logout();
    app.instance.render();
    if ($('#start').length > 0) {
      app.instance.start();
    } else {
      app.instance.mainView.render();
    }
    
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