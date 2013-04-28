var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('./util');

module.exports = Backbone.Router.extend({

  routes: {
    ':user': 'profile',
    ':user/:repo': 'repo',
    ':user/:repo/*path': 'path',
    '*default': 'start'
  },

  initialize: function(options) {
    this.model = options.model;

    // Load up the main layout
    this.application = new app.views.App({
      el: '#prose',
      model: this.model
    }).render();
  },

  // #example-user
  // #example-organization
  profile: function(user) {
    var router = this;

    utils.loader.loading('Loading Profile');

    if (confirmExit()) {
      app.state = app.state || {};
      app.state.user = user;
      app.state.title = user;
      app.state.repo = '';
      app.state.mode = '';
      app.state.branch = '';
      app.state.path = '';

      app.models.loadRepos(user, function(err, data) {
        data.authenticated = !! window.authenticated;

        router.application.render();
        var view = new app.views.Profile({
          model: _.extend(router.model, data)
        }).render();

        $('#content').empty().append(view.el);
        utils.loader.loaded();
      });
    }
  },

  // #example-user/example-repo
  repo: function(user, repo) {
    var router = this;
    utils.loader.loading('Loading Posts');

    app.state = {
      user: user,
      repo: repo,
      mode: 'tree',
      branch: '',
      path: ''
    }

    app.models.loadPosts(user, repo, app.state.branch, app.state.path, _.bind(function (err, data) {
      if (err) return router.notify('error', 'This post does not exist.');

      router.application.render();
      var view = new app.views.Posts({
        model: data
      }).render();

      $('#content').empty().append(view.el);
      utils.loader.loaded();
    }, this));
  },

  // #example-user/example-repo/tree/BRANCH
  repoBranch: function(user, repo, branch, path) {

    var router = this;
    utils.loader.loading('Loading Posts');

    app.models.loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      if (err) return router.notify('error', 'This post does not exist.');
      router.application.render();

      var view = new app.views.Posts({
        model: data
      }).render();

      $('#content').empty().append(view.el);
      utils.loader.loaded();
    }, this));
  },

  path: function(user, repo, path) {
    var parts;
    app.state.user = user;
    app.state.repo = repo;
 
    url = _.extractURL(path);

    if (url.mode === 'tree') {
      this.repoBranch(user, repo, url.branch, url.path);
    } else if (url.mode === 'new') {
      this.newPost(user, repo, url.branch, url.path);
    } else { // preview or edit ..
      parts = _.extractFilename(url.path);
      app.state.file = parts[1];
      this.post(user, repo, url.branch, parts[0], parts[1], url.mode);
    }
  },

  newPost: function (user, repo, branch, path) {
    var router = this;
    utils.loader.loading('Creating a new post');
    app.models.loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      app.models.emptyPost(user, repo, branch, path, _.bind(function (err, data) {

        data.jekyll = _.jekyll(path, data.file);
        data.preview = false;
        data.markdown = _.markdown(data.file);
        data.lang = _.mode(data.file);

        router.application.render();
        var view = new app.views.Post({
          model: data
        }).render();

        $('#content').empty().append(view.el);
 
        this.mainView.makeDirty();
        app.state.file = data.file;
        utils.loader.loaded();

      }, this));
    }, this));
  },

  post: function(user, repo, branch, path, file, mode) {
    var router = this;

    if (mode === 'edit') {
      utils.loader.loading('Loading Post');
    } else {
      utils.loader.loading('Previewing Post');
    }

    app.models.loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      if (err) return router.notify('error', 'This post does not exist.');
      app.models.loadPost(user, repo, branch, path, file, _.bind(function (err, data) {
        if (err) return router.notify('error', 'This post does not exist.');

        app.state.markdown = data.markdown;
        data.preview = (mode !== 'edit');
        data.lang = _.mode(file);

        router.application.render();
        var view = new app.views.Post({
          model: data
        }).render();

        $('#content').empty().html(view.el);

        utils.loader.loaded();
      }, this));
    }, this));
  },

  start: function() {
    if (window.authenticated) {
      $('#start').remove();

      // Redirect
      router.navigate(app.username, {trigger: true});
    } else {
      this.application.render();
      var view = new app.views.Start({
        model: _.extend(this.model, {
          authenticated: !! window.authenticated
        })
      }).render();

      $('#content').empty();
      $('#prose').append(view.el);
    }
  },

  notify: function(type, message) {
    this.application.render();

    var view = new app.views.Notification({
      'type': type,
      'message': message
    }).render();

    $('#content').empty().append(view.el);
    utils.loader.loaded();
  }
});
