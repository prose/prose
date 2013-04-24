var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('.././util');

module.exports = Backbone.View.extend({

  events: {
    'click #notification .create': 'createPost'
  },

  createPost: function (e) {
    var hash = window.location.hash.split('/');
    hash[2] = 'new';
    hash[hash.length - 1] = '?file=' + hash[hash.length - 1];

    router.navigate(_(hash).compact().join('/'), true);
    return false;
  },

  // Initialize
  // ----------

  initialize: function () {
    _.bindAll(this);
    var that = this;
    this.app = new window.app.views.App({
      model: this.model
    });

    function calculateLayout() {
      if (that.mainView && that.mainView.refreshCodeMirror)  {
        that.mainView.refreshCodeMirror();
      }
    }

    var lazyLayout = _.debounce(calculateLayout, 300);
    $(window).resize(lazyLayout);
  },


  renderApp: function () {
    $(this.app.render().el).prependTo(this.el);
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

  start: function (username) {
    var that = this;
    app.state.title = '';

    // Render out the application view
    $(that.app.render().el).prependTo(that.el);

    this.replaceMainView('start', new window.app.views.Start({
      model: _.extend(this.model, {
        authenticated: !! window.authenticated
      })
    }).render());
  },

  profile: function (username) {
    var that = this;
    app.state.title = username;

    utils.loader.loading('Loading Profile');
    window.app.models.loadRepos(username, function (err, data) {

      // Render out the application view
      $(that.app.render().el).prependTo(that.el);

      data.authenticated = !! window.authenticated;
      that.replaceMainView('profile', new window.app.views.Profile({
        model: _.extend(that.model, data)
      }).render());
      utils.loader.loaded();
    });
  },

  staticView: function () {
    // Render out the application view
    $(this.app.render().el).prependTo(this.el);
  },

  posts: function (user, repo, branch, path) {
    var that = this;
    utils.loader.loading('Loading Posts');
    window.app.models.loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      if (err) return this.notify('error', 'This post does not exist.');
      // Render out the application view
      $(that.app.render().el).prependTo(that.el);
      this.replaceMainView('posts', new window.app.views.Posts({
        model: data
      }).render());
      utils.loader.loaded();
    }, this));
  },

  post: function (user, repo, branch, path, file, mode) {
    var that = this;

    utils.loader.loading('Loading Post');

    window.app.models.loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      if (err) return this.notify('error', 'This post does not exist.');
      window.app.models.loadPost(user, repo, branch, path, file, _.bind(function (err, data) {
        if (err) return this.notify('error', 'This post does not exist.');

        app.state.markdown = data.markdown;

        // Render out the application view
        $(that.app.render().el).prependTo(that.el);

        data.preview = (mode !== 'edit');
        data.lang = _.mode(file);
        this.replaceMainView(window.authenticated ? 'post' : 'read-post', new window.app.views.Post({
          model: data
        }).render());
        utils.loader.loaded();
      }, this));

      // Render out the application view
      $(that.app.render().el).prependTo(that.el);

    }, this));
  },

  preview: function (user, repo, branch, path, file, mode) {
    utils.loader.loading('Previewing Post');

    window.app.models.loadConfig(user, repo, branch, _.bind(function () {
      window.app.models.loadPost(user, repo, branch, path, file, _.bind(function (err, data) {
        if (err) return this.notify('error', 'This post does not exist.');
        new window.app.views.Preview({
          model: data
        }).render();
      }, this));
    }, this));
  },

  newPost: function (user, repo, branch, path) {
    var that = this;
    window.app.models.loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      window.app.models.emptyPost(user, repo, branch, path, _.bind(function (err, data) {

        // Render out the application view
        $(that.app.render().el).prependTo(that.el);

        data.jekyll = _.jekyll(path, data.file);
        data.preview = false;
        data.markdown = _.markdown(data.file);
        data.lang = _.mode(data.file);

        this.replaceMainView('post', new window.app.views.Post({
          model: data
        }).render());

        this.mainView.makeDirty();
        app.state.file = data.file;
      }, this));
    }, this));
  },

  notify: function (type, message) {
    // Render out the application view
    $(this.app.render().el).prependTo(this.el);

    this.replaceMainView('notification', new window.app.views.Notification({
      'type': type,
      'message': message
    }).render());
    utils.loader.loaded;
  }
});
