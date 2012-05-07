(function(config, models, views, routers, utils, templates) {

views.Start = Backbone.View.extend({
  id: 'start',

  events: {
    'submit #login_form': '_login',
    'click .select-repo': '_selectRepo'
  },

  initialize: function(options) {},

  _selectRepo: function(e) {
    var user = $(e.currentTarget).attr('data-user'),
        repo = $(e.currentTarget).attr('data-repo');

    $('.branches').hide();
    var $branches = $(e.currentTarget).next().empty().show();
    
    loadBranches(user, repo, function(err, branches) {
      if (branches.length === 1) {
        router.navigate('#' + [user, repo, branches[0]].join('/'), true);
      } else if (branches.length > 1) {
        $branches.append('<div class="label">Choose a branch:</div>')
        _.each(branches, function(branch) {
          $branches.append($('<div class="branch"><a href="#'+[user, repo].join('/')+'">'+branch+'</a></div>'));
        });
      } else if (branches.length === 0) {
        $branches.append('<div class="not-jekyll">Not a valid Jekyll site.</div>')
      }
    });

    return false;
  },

  _login: function() {
    var self = this;
    var user = self.$('#github_user').val();
    var password = self.$('#github_password').val();

    login({username: user, password: password}, function(err) {
      if (err) return app.instance.notify('error', err);
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
