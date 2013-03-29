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
    var that = this;
    this.header = new views.Header({model: this.model});

    // No longer needed
    // $(window).on('scroll', function() {
    //   if ($(window).scrollTop()>60) {
    //     $('#post').addClass('sticky-menu');
    //   } else {
    //     $('#post').removeClass('sticky-menu');
    //   }
    // });

    function calculateLayout() {
      if (that.mainView && that.mainView.refreshCodeMirror) {
        that.mainView.refreshCodeMirror();
      }
    }

    var lazyLayout = _.debounce(calculateLayout, 300);
    $(window).resize(lazyLayout);
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
    // Make sure the header gets shown
    if (name !== "start") $('#header').show();

    if (this.mainView) {
      this.mainView.remove();
    } else {
      $('#main').empty();
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
    this.loading('Loading posts ...');
    loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      this.loaded();
      if (err) return this.notify('error', 'The requested resource could not be found.');
      this.header.render();
      this.replaceMainView("posts", new views.Posts({ model: data, id: 'posts' }).render());
    }, this));
  },

  post: function (user, repo, branch, path, file, mode) {
    this.loading('Loading post ...');
    loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      if (err) return this.notify('error', 'The requested resource could not be found.');
      loadPost(user, repo, branch, path, file, _.bind(function (err, data) {
        this.loaded();
        this.header.render();
        if (err) return this.notify('error', 'The requested resource could not be found.');
        data.preview = !(mode === "edit");
        data.lang = _.mode(file);
        this.replaceMainView(window.authenticated ? "post" : "read-post", new views.Post({ model: data, id: 'post' }).render());
        var that = this;
      }, this));
      this.header.render();
    }, this));
  },

  preview: function (user, repo, branch, path, file, mode) {
    this.loading('Preview post ...');
  
    loadConfig(user, repo, branch, _.bind(function() {
      loadPost(user, repo, branch, path, file, _.bind(function (err, data) {
        if (err) return this.notify('error', 'The requested resource could not be found.');
        new views.Preview({ model: data }).render();
      }, this));
    }, this));
  },


  newPost: function (user, repo, branch, path) {
    this.loading('Creating file ...');
    loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      emptyPost(user, repo, branch, path, _.bind(function(err, data) {
        this.loaded();
        data.jekyll = _.jekyll(path, data.file);
        data.preview = false;
        data.markdown = _.markdown(data.file);
        data.lang = _.mode(data.file);
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
    this.loading('Loading profile ...');
    loadRepos(username, function(err, data) {
      that.header.render();
      that.loaded();
      data.authenticated = !!window.authenticated;
      that.replaceMainView("start", new views.Profile({id: "start", model: data}).render());
    });
  },

  start: function(username) {
    var that = this;
    app.state.title = "";
    this.header.render();

    this.replaceMainView("start", new views.Start({
      id: "start",
      model: _.extend(this.model, { authenticated: !!window.authenticated} )
    }).render());
  },

  notify: function(type, message) {
    this.header.render();
    this.replaceMainView("notification", new views.Notification(type, message).render());
  },

  loading: function(msg) {
    $('#main').html('<div class="loading"><span>'+ msg || 'Loading ...' +'</span></div>');
  },

  loaded: function() {
    $('#main .loading').remove();
  }

});

}).apply(this, window.args);
