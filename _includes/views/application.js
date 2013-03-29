(function(config, models, views, routers, utils, templates) {

// This is the top-level piece of UI.

views.Application = Backbone.View.extend({

  // Events
  // ------

  events: {
    'click .toggle-view': 'toggleView'
  },

  toggleView: function(e) {
    var link  = $(e.currentTarget),
        route = link.attr('href').replace(/^\//, '');

    $('.toggle-view.active').removeClass('active');
    link.addClass('active');
    router.navigate(route, true);

    return false;
  },

  // Initialize
  // ----------

  initialize: function () {
    _.bindAll(this);
    var that = this;
    this.app = new views.App({model: this.model});

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
    $(this.app.render().el).prependTo(this.el);
    return this;
  },


  // Helpers
  // -------

  replaceMainView: function (name, view) {
    $('body').removeClass().addClass(name);

    // Make sure the header get's shown
    if (name !== 'start') $('#app').show();

    if (this.mainView) {
      this.mainView.remove();
    } else {
      $('#content').empty();
    }
    this.mainView = view;
    $(view.el).appendTo(this.$('#content'));
  },


  // Main Views
  // ----------

  staticView: function() {
    this.app.render();
  },

  posts: function (user, repo, branch, path) {
    this.loading('Loading posts ...');
    loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      this.loaded();
      if (err) return this.notify('error', 'The requested resource could not be found.');
      this.app.render();
      this.replaceMainView('posts', new views.Posts({ model: data, id: 'posts' }).render());
    }, this));
  },

  post: function (user, repo, branch, path, file, mode) {
    this.loading('Loading post ...');
    loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      if (err) return this.notify('error', 'The requested resource could not be found.');
      loadPost(user, repo, branch, path, file, _.bind(function (err, data) {
        this.loaded();
        this.app.render();
        if (err) return this.notify('error', 'The requested resource could not be found.');
        data.preview = (mode !== 'edit');
        data.lang = _.mode(file);
        this.replaceMainView(window.authenticated ? 'post' : 'read-post', new views.Post({ model: data, id: 'post' }).render());
        var that = this;
      }, this));
      this.app.render();
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
        this.replaceMainView('post', new views.Post({ model: data, id: 'post' }).render());
        this.mainView._makeDirty();
        app.state.file = data.file;
        this.app.render();
      }, this));
    }, this));
  },

  profile: function(username) {
    var that = this;
    app.state.title = username;
    this.loading('Loading profile ...');
    loadRepos(username, function(err, data) {
      that.app.render();
      that.loaded();
      data.authenticated = !!window.authenticated;
      that.replaceMainView('start', new views.Profile({id: 'start', model: data}).render());
    });
  },

  start: function(username) {
    var that = this;
    app.state.title = '';
    this.app.render();

    this.replaceMainView('start', new views.Start({
      id: 'start',
      model: _.extend(this.model, { authenticated: !!window.authenticated} )
    }).render());
  },

  notify: function(type, message) {
    this.app.render();
    this.replaceMainView('notification', new views.Notification(type, message).render());
  },

  loading: function(msg) {
    // $('body').html('<div class="loading"><span>' + msg || 'Loading ...' + '</span></div>');
  },

  loaded: function() {
    // $('.loading').remove();
  }

});

}).apply(this, window.args);
