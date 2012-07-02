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

    $(window).on('scroll', function() {
      if ($(window).scrollTop()>60) {
        $('#post').addClass('sticky-menu');
      } else {
        $('#post').removeClass('sticky-menu');
      }
    });
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

  static: function() {
    this.header.render();
    // No-op ;-)
  },

  posts: function (user, repo, branch, path) {
    loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      if (err) return this.notify('error', 'The requested resource could not be found.');
      this.header.render();
      this.replaceMainView("posts", new views.Posts({ model: data, id: 'posts' }).render());
    }, this));
  },

  post: function (user, repo, branch, path, file, preview) {
    loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      if (err) return this.notify('error', 'The requested resource could not be found.');
      loadPost(user, repo, branch, path, file, _.bind(function (err, data) {
        this.header.render();
        if (err) return this.notify('error', 'The requested resource could not be found.');
        data.preview = preview;
        data.lang = _.mode(file);
        this.replaceMainView("post", new views.Post({ model: data, id: 'post' }).render());
        var that = this;
      }, this));
      this.header.render();
    }, this));
  },

  newPost: function (user, repo, branch, path) {
    loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      emptyPost(user, repo, branch, path, _.bind(function(err, data) {
        data.jekyll = _.jekyll(path, data.file);
        data.preview = false;
        data.markdown = _.markdown(data.file);
        this.replaceMainView("post", new views.Post({ model: data, id: 'post' }).render());
        this.mainView._makeDirty();
        app.state.file = data.file;
        this.header.render();
      }, this));
    }, this));
  },

  profile: function(username) {
    var that = this;
    app.state.title = username;
    this.header.render();
    loadRepos(username, function(err, data) {
      data.authenticated = window.authenticated;
      that.replaceMainView("start", new views.Profile({id: "start", model: data}).render());
    });
  },

  start: function(username) {
    var that = this;
    app.state.title = "";
    this.header.render();

    this.replaceMainView("start", new views.Start({
      id: "start",
      model: _.extend(this.model, { authenticated: window.authenticated} )
    }).render());
  },

  notify: function(type, message) {
    this.header.render();
    this.replaceMainView("notification", new views.Notification(type, message).render());
  }
});

}).apply(this, window.args);
