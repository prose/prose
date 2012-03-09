(function(config, models, views, routers, utils, templates) {

// This is the top-level piece of UI.

views.Application = Backbone.View.extend({

  // Events
  // ------

  events: {
    'click .toggle-view': 'toggleView'
  },

  toggleView: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var link  = $(e.currentTarget),
        route = link.attr('href').replace(/^\//, '');
    
    $('.toggle-view.active').removeClass('active');
    link.addClass('active');
    router.navigate(route, true);
  },


  // Initialize
  // ----------

  initialize: function () {
    _.bindAll(this);
    
    this.header = new views.Header({model: this.model});
  },

  // Should be rendered just once
  render: function () {
    $(this.header.render().el).prependTo(this.el);
    return this;
  },


  // Helpers
  // -------

  replaceMainView: function (name, view) {
    $('body').removeClass().addClass('current-view '+name);
    if (this.mainView) {
      this.mainView.remove();
    }
    this.mainView = view;
    $(view.el).appendTo(this.$('#main'));
  },


  // Main Views
  // ----------

  posts: function (repo) {
    loadPosts(repo, _.bind(function (err, data) {
      this.replaceMainView("posts", new views.Posts({ model: data, id: 'posts' }).render());
    }, this));
  },

  post: function (repo, path) {
    loadPost(repo, path, _.bind(function (err, data) {
      this.replaceMainView("posts", new views.Post({ model: data, id: 'post' }).render());
    }, this));
  },

  newPost: function (repo) {
    this.replaceMainView("new_post", new views.NewPost({id: "new_post", model: {repo: repo}}).render());
  }

});

}).apply(this, window.args);
