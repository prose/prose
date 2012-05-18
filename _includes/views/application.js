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

  posts: function (user, repo, branch, path) {
    loadSite(user, repo, branch, path, _.bind(function (err, data) {
      if (err) return this.notify('error', 'Seems like the chosen repository is not a valid Jekyll site.');
      this.header.render();
      this.replaceMainView("posts", new views.Posts({ model: data, id: 'posts' }).render());
    }, this));
  },

  post: function (user, repo, branch, path, file) {
    loadSite(user, repo, branch, path, _.bind(function (err, data) {
      if (err) return this.notify('error', 'Seems like the chosen repository is not a valid Jekyll site.');
      loadPost(user, repo, branch, path, file, _.bind(function (err, data) {
        this.header.render();
        this.replaceMainView("post", new views.Post({ model: data, id: 'post' }).render());
      }, this));
      this.header.render();
    }, this));
  },

  newPost: function (user, repo, branch, path) {
    this.header.render();
    emptyPost(user, repo, branch, path, _.bind(function(err, data) {
      this.replaceMainView("post", new views.Post({ model: data, id: 'post' }).render());
    }, this));
  },

  start: function() {
    this.header.render();
    this.replaceMainView("start", new views.Start({id: "start", model: {authenticated: authenticated()}}).render());
  },

  notify: function(type, message) {
    this.header.render();
    this.replaceMainView("notification", new views.Notification(type, message).render());
  }

});

}).apply(this, window.args);
