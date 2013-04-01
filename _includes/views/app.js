(function(config, models, views, routers, utils, templates) {

views.App = Backbone.View.extend({
  id: 'app',

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
    $(this.el).html(templates.app(_.extend(this.model, app.state, {
        state: app.state
    })));

    dropdown();
    return this;
  }
});

}).apply(this, window.args);
