(function(config, models, views, routers, utils, templates) {

views.Start = views.Profile.extend({
  id: 'start',

  events: {
    'submit #login_form': '_login'
  },

  initialize: function(options) {},

  _login: function() {
    var self = this;

    var user = self.$('#github_user').val();
    var password = self.$('#github_password').val();

    login({username: user, password: password}, function(err) {
      if (err) return self.$('.bad-credentials').show();
      window.location.reload();
    });
    return false;
  },

  render: function() {
    $(this.el).html(templates.start(this.model));
    if (!window.authenticated) $('#header').hide();
    return this;
  }
});

}).apply(this, window.args);
