(function(config, models, views, routers, utils, templates) {

views.Header = Backbone.View.extend({
  id: 'header',
  className: 'header',

  events: {
    'click a.logout': '_logout'
  },

  _logout: function() {
    logout();
    app.instance.render();
    if ($('#start').length > 0) {
      app.instance.start();
    } else {
      window.location.reload();
    }
    return false;
  },

  render: function() {
    $(this.el).html(templates.header(_.extend(this.model, {state: app.state})));

    dropdown();
    return this;
  }
});

}).apply(this, window.args);
