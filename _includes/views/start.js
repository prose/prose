(function(config, models, views, routers, utils, templates) {

views.Start = Backbone.View.extend({
  id: 'start',

  events: {
    "submit #login_form": "_login"
  },

  initialize: function(options) {
    
  },

  _login: function() {
    var user = this.$('#github_user').val();
    var password = this.$('#github_password').val();
    
    login({username: user, password: password}, function(err) {
      if (err) return alert(err);
      window.location.reload();
    });
    
    return false;
  },

  render: function() {
    $(this.el).html(templates.start(_.extend(this.model, {
      repo: app.state.repo,
      available_repos: app.instance.model.available_repos
    })));
    return this;
  }
});

}).apply(this, window.args);