var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');

var User = require('./models/user');
var Users = require('./collections/users');

var Repo = require('./models/repo');

var ProfileView = require('./views/profile');
var ReposView = require('./views/repos');
var RepoView = require('./views/repo');
var SearchView = require('./views/search');

var templates = require('../dist/templates');
var utils = require('./util');

module.exports = Backbone.Router.extend({

  routes: {
    'about(/)': 'about',
    'error/:code': 'error',
    ':user(/)': 'profile',
    ':user/:repo(/)': 'repo',
    ':user/:repo/*path(/)': 'path',
    '*default': 'start'
  },

  initialize: function(options) {
    this.user = options.user;

    this.users = new Users();
    this.users.add(this.user);

    this.eventRegister = app.eventRegister;

    // Load up the main layout
    this.app = new app.views.App({
      el: '#prose',
      model: {}
    });

    this.app.render();
  },

  resetState: function() {
    app.state = {
      user: '',
      repo: '',
      mode: 'page',
      branch: '',
      path: '',
      file: ''
    };
  },

  about: function() {
    this.resetState();
    router.app.render({
      noMenu: true
    });

    var view = new app.views.Documentation({
      page: 'about'
    }).render();

    $('#main').empty().append(view.el);
  },

  // #example-user
  // #example-organization
  profile: function(login) {
    utils.loader.loading('Loading Profile');

    var user = this.users.findWhere({ login: login }) ||
      this.users.add(new User({ login: login })).findWhere({ login: login });

    var search = new SearchView({ model: user.repos });
    var repos = new ReposView({ model: user.repos, search: search });

    var content = new ProfileView({
      search: search,
      repos: repos
    });

    content.setElement(this.app.$el.find('#main')).render();

    this.user.repos.fetch();
    this.user.orgs.fetch();

    // TODO: build event-driven loader queue
    utils.loader.loaded();
  },

  // #example-user/example-repo
  repo: function(login, repoName) {
    var router = this;
    utils.loader.loading('Loading Posts');

    var user = this.users.findWhere({ login: login }) ||
      this.users.add(new User({ login: login })).findWhere({ login: login });
    
    var repo = user.repos.findWhere({ name: repoName }) ||
      user.repos.add(new Repo({
        name: repoName,
        owner: { login: login }
      })).findWhere({ name: repoName });

    var content = new RepoView({
      model: repo
    });

    content.setElement(this.app.$el.find('#main'));
    repo.fetch();

    utils.loader.loaded();
  },

  // #example-user/example-repo/tree/BRANCH
  repoBranch: function(user, repo, branch, path) {

    var router = this;
    utils.loader.loading('Loading Posts');

    app.models.loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      if (err) return router.notify('error', 'This post does not exist.');
      router.app.render();

      var view = new app.views.Posts({
        model: data
      }).render();

      utils.loader.loaded();
      $('#content').empty().append(view.el);
    }, this));
  },

  path: function(user, repo, path) {
    var parts;
    app.state.user = user;
    app.state.repo = repo;

    // Clean any previous view
    this.eventRegister.trigger('remove');
    url = _.extractURL(path);

    if (url.mode === 'tree') {
      this.repoBranch(user, repo, url.branch, url.path);
    } else if (url.mode === 'new') {
      this.newPost(user, repo, url.branch, url.path);
    } else if (url.mode === 'preview') {
      parts = _.extractFilename(url.path);
      app.state.file = parts[1];
      this.preview(user, repo, url.branch, parts[0], parts[1], url.mode);
    } else { // blob or edit ..
      parts = _.extractFilename(url.path);
      app.state.file = parts[1];
      this.post(user, repo, url.branch, parts[0], parts[1], url.mode);
    }
  },

  newPost: function (user, repo, branch, path) {
    // TODO Fix this, shouldn't have to pass
    // something like this here.
    app.state.markdown = true;

    utils.loader.loading('Creating a new post');
    app.models.loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      app.models.emptyPost(user, repo, branch, path, _.bind(function (err, data) {

        data.jekyll = _.jekyll(path, data.file);
        data.preview = false;
        data.markdown = _.markdown(data.file);
        data.lang = _.mode(data.file);

        this.application.render({
          jekyll: data.jekyll,
          noMenu: true
        });

        var view = new app.views.Post({
          model: data
        }).render();

        utils.loader.loaded();
        $('#content').empty().append(view.el);
        app.state.file = data.file;

      }, this));
    }, this));
  },

  post: function(user, repo, branch, path, file, mode) {
    if (mode === 'edit') {
      utils.loader.loading('Loading Post');
    } else {
      utils.loader.loading('Previewing Post');
    }

    app.models.loadPosts(user, repo, branch, path, _.bind(function(err, data) {
      if (err) return this.notify('error', 'This file does not exist.');
      app.models.loadPost(user, repo, branch, path, file, _.bind(function(err, data) {
        if (err) return this.notify('error', 'This file does not exist.');

        app.state.markdown = data.markdown;
        data.jekyll = !!data.metadata;
        data.lang = _.mode(file);

        this.application.render({
          jekyll: data.jekyll,
          noMenu: true
        });

        var view = new app.views.Post({
          model: data
        }).render();

        utils.loader.loaded();
        $('#content').empty().html(view.el);
      }, this));
    }, this));
  },

  preview: function(user, repo, branch, path, file, mode) {
    var router = this;
    utils.loader.loading('Previewing Post');

    app.models.loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      if (err) return router.notify('error', 'This post does not exist.');
      app.models.loadPost(user, repo, branch, path, file, _.bind(function (err, data) {
        if (err) {
          app.models.emptyPost(user, repo, branch, path, _.bind(cb, this));
        } else {
          cb(err, data);
        }

        function cb(err, data) {
          var view = new app.views.Preview({
            model: data
          }).render();

          utils.loader.loaded();
        }
      }, this));
    }, this));
  },

  start: function() {
    if (window.authenticated) {
      $('#start').remove();

      // Redirect
      router.navigate(this.user.get('login'), {trigger: true});
    } else {
      this.application.render({
        hideInterface: true
      });

      var view = new app.views.Start({
        model: _.extend(this.model, {
          authenticated: !! window.authenticated
        })
      }).render();

      $('#content').empty();
      $('#prose').append(view.el);
    }
  },

  // if the application after routing
  // hits an error code router.navigate('error' + err.error)
  // sends the route here.
  error: function(code) {
    switch (code) {
      case '404':
        code = 'Page not Found'
      break;
      default:
        code = 'Error'
      break;
    }

    this.application.render({
      error: true
    });

    var view = new app.views.Notification({
      'type': 'Error',
      'key': 'error',
      'message': code
    }).render();

    utils.loader.loaded();
    $('#content').empty().append(view.el);
  },

  notify: function(type, message) {
    // TODO Fix this, shouldn't have to pass
    // something like this here.
    app.state.markdown = false;
    this.application.render({
      error: true
    });

    var view = new app.views.Notification({
      'type': type,
      'key': 'page-error',
      'message': message
    }).render();

    utils.loader.loaded();
    $('#content').empty().append(view.el);
  }
});
