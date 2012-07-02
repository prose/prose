(function(config, models, views, routers, utils, templates) {

views.Profile = Backbone.View.extend({
  id: 'start',

  events: {
    'click .select-repo': '_selectRepo'
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
      if (err) {
        $branches.append('<div class="repo-error">No branches found.</div>');
        _.delay(function() {
          $branches.hide();
        }, 2000);
        return;
      }

      if (branches.length === 1) {
        router.navigate('#' + [user, repo, branches[0]].join('/'), true);
      } else if (branches.length > 1) {
        _.each(branches, function(branch) {
          $branches.append($('<a class="branch" href="#'+[user, repo, branch].join('/')+'">'+branch+'</a>'));
        });
      }
    });
    
    return false;
  },

  render: function() {
    $(this.el).html(templates.profile(this.model));
    if (!window.authenticated) $('#header').hide();
    return this;
  }
});

}).apply(this, window.args);
