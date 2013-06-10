var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var ProfileView = require('./views/profile');
var HeaderView = require('./views/header');
var ReposView = require('./views/repos');
var SearchView = require('./views/search');
var OrgsView = require('./views/orgs');
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
    this.eventRegister = app.eventRegister;

    // Load up the main layout
    this.application = new app.views.App({
      el: '#prose',
      model: {}
    });
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
    router.application.render({
      noMenu: true
    });

    var view = new app.views.Documentation({
      page: 'about'
    }).render();

    $('#content').empty().append(view.el);
  },

  // #example-user
  // #example-organization
  profile: function(user) {
    var router = this;
    utils.loader.loading('Loading Profile');

    // Clean any previous view
    this.eventRegister.trigger('remove');

    app.state = app.state || {};
    app.state.user = user;
    app.state.title = user;
    app.state.repo = '';
    app.state.mode = '';
    app.state.branch = '';
    app.state.path = '';
    app.state.file = '';

    router.application.render();

    var $profile = $(_.template(templates.profile)());
    $('#content').html($profile);

    var header = new HeaderView({ model: this.user, alterable: false });
    $('#heading').html(header.render().el);

    var repos = new ReposView({ model: this.user.repos });
    $profile.find('#repos').html(repos.el);

    $profile.find('#search').html(new SearchView({ model: this.user.repos, view: repos }).render().el);
    $('#drawer').html(new OrgsView({ model: this.user.orgs }).el);

    this.user.repos.load();
    this.user.orgs.load();

    // TODO: build event-driven loader queue
    utils.loader.loaded();
  },

  // #example-user/example-repo
  repo: function(user, repo) {
    var router = this;
    utils.loader.loading('Loading Posts');

    // Clean any previous view
    this.eventRegister.trigger('remove');

    app.state = {
      user: user,
      repo: repo,
      mode: 'tree',
      branch: '',
      path: '',
      file: ''
    };

    app.models.loadPosts(user, repo, app.state.branch, app.state.path, _.bind(function (err, data) {
      if (err) return router.notify('error', 'This post does not exist.');

      router.application.render();
      var view = new app.views.Posts({
        model: data
      }).render();

      utils.loader.loaded();
      $('#content').empty().append(view.el);

      /*
      router.model.set('repo', router.model.get('repos').find(function(repo) {
        return repo.get('name') === data.repo && repo.get('owner').login === data.user;
      }));
      */
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
    url = utils.extractURL(path);

    if (url.mode === 'tree') {
      this.repoBranch(user, repo, url.branch, url.path);
    } else if (url.mode === 'new') {
      this.newPost(user, repo, url.branch, url.path);
    } else if (url.mode === 'preview') {
      parts = utils.extractFilename(url.path);
      app.state.file = parts[1];
      this.preview(user, repo, url.branch, parts[0], parts[1], url.mode);
    } else { // blob or edit ..
      parts = utils.extractFilename(url.path);
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

        data.jekyll = utils.jekyll(path, data.file);
        data.preview = false;
        data.markdown = utils.markdown(data.file);
        data.lang = utils.mode(data.file);

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
        data.lang = utils.mode(file);

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
