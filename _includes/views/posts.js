(function(config, models, views, routers, utils, templates) {

views.Posts = Backbone.View.extend({
  events: {
    "change #repository_paths": "_switchPath",
  },

  initialize: function(options) {
    
  },

  _switchPath: function(e) {
    router.navigate(app.username + "/" + app.state.repo + "/" + app.state.branch + "/" + $(e.currentTarget).val(), true);
    return false;
  },

  render: function() {
    $(this.el).html(templates.posts(_.extend(this.model, app.state, {
      paths: app.state.config ? app.state.config.columnist.paths : null
    })));
    return this;
  }
});

}).apply(this, window.args);