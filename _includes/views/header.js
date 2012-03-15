(function(config, models, views, routers, utils, templates) {

views.Header = Backbone.View.extend({
  id: 'header',

  events: {
    "change #repository_name": "_switchRepository",
    "click a.logout": "_logout"
  },

  _logout: function() {
    logout();
    window.location.href = '';
  },

  _switchRepository: function(e) {
    router.navigate(app.username + "/" + $(e.currentTarget).val() + "/master", true);
    return false;
  },

  initialize: function(options) {
    
  },

  render: function() {
    $(this.el).html(templates.header(_.extend(this.model, { 
      repo: app.state.repo,
      paths: app.state.config ? app.state.config.columnist.paths : null,
      path: app.state.path ? app.state.path : null
    })));
    return this;
  }
});

}).apply(this, window.args);