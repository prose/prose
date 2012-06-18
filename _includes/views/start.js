(function(config, models, views, routers, utils, templates) {

views.Start = Backbone.View.extend({
  id: 'start',

  events: {
    'submit #login_form': '_login',
    'click .select-repo': '_selectRepo',
    'click #authorize': '_authorize'
  },

  initialize: function(options) {},

  _selectRepo: function(e) {
    var user = $(e.currentTarget).attr('data-user'),
        repo = $(e.currentTarget).attr('data-repo');

    if ($(e.target).hasClass('branch')) return;
    
    var $branches = $(e.currentTarget).find('.branches').show();
    $branches.html('<div class="loading-branches"> </div>');
    
    loadBranches(user, repo, function(err, branches) {
      $branches.empty();
      if (branches.length === 1) {
        router.navigate('#' + [user, repo, branches[0]].join('/'), true);
      } else if (branches.length > 1) {
        _.each(branches, function(branch) {
          $branches.append($('<a class="branch" href="#'+[user, repo, branch].join('/')+'">'+branch+'</a>'));
        });
      } else if (branches.length === 0) {
        $branches.append('<div class="not-jekyll">Not a Jekyll site.</div>');
        _.delay(function() {
          $branches.hide();
        }, 2000);
      }
    });
    
    return false;
  },

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
  
  _authorize: function() {
    var url = encodeURI('https://github.com/login/oauth/authorize?client_id={{site.oauth_client_id}}&scope=repo, user');
    window.location.href = url;
  },

  render: function() {

    $(this.el).html(templates.start(_.extend(this.model, {
      repo: app.state.repo,
      available_repos: app.instance.model.available_repos,
      owners: app.instance.model.owners,
    })));
    if (!window.authenticated) $('#header').hide();
    return this;
  }
});

}).apply(this, window.args);
