var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('./util');

module.exports = Backbone.Router.extend({

  routes: {
    'about(/)': 'about',
    'chooselanguage(/)': 'chooseLanguage',
    'error/:code': 'error',
    ':user(/)': 'profile',
    ':user/:repo(/)': 'repo',
    ':user/:repo/*path(/)': 'path',
    '*default': 'start'
  },

  initialize: function(options) {
    this.model = options.model;
    this.eventRegister = app.eventRegister;

    // Load up the main layout
    this.application = new app.views.App({
      el: '#prose',
      model: this.model
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
    var view = new app.views.Documentation({
      page: 'about'
    }).render();

    this.minimalPage();
    $('#content').empty().append(view.el);
  },

  chooseLanguage: function() {
    var view = new app.views.ChooseLanguage({
      page: 'about'
    }).render();

    this.minimalPage();
    $('#content').empty().append(view.el);
  },

  minimalPage: function() {
    this.resetState();
    router.application.render({
      noMenu: true
    });
  },

  // #example-user
  // #example-organization
  profile: function(user) {
    var router = this;
    utils.loader.loading(t('loading.repos'));

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

    app.models.loadRepos(user, function(err, data) {
      data.authenticated = !! window.authenticated;

      router.application.render();
      var view = new app.views.Profile({
        model: _.extend(router.model, data)
      }).render();

      utils.loader.loaded();
      $('#content').empty().append(view.el);
    });
  },

  // #example-user/example-repo
  repo: function(user, repo) {
    var router = this;
    utils.loader.loading(t('loading.repo'));

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
      if (err) return router.notify('error', t('notification.error.exists'));

      router.application.render();
      var view = new app.views.Posts({
        model: data
      }).render();

      utils.loader.loaded();
      $('#content').empty().append(view.el);
    }, this));
  },

  // #example-user/example-repo/tree/BRANCH
  repoBranch: function(user, repo, branch, path) {

    var router = this;
    utils.loader.loading(t('loading.repo'));

    app.models.loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      if (err) return router.notify('error', t('notification.error.exists'));
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

    utils.loader.loading(t('loading.creating'));
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
      utils.loader.loading(t('loading.file'));
    } else {
      utils.loader.loading(t('loading.preview'));
    }

    app.models.loadPosts(user, repo, branch, path, _.bind(function(err, data) {
      if (err) return this.notify('error', t('notification.error.exists'));
      app.models.loadPost(user, repo, branch, path, file, _.bind(function(err, data) {
        if (err) return this.notify('error', t('notification.error.exists'));

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
    utils.loader.loading(t('loading.preview'));

    app.models.loadPosts(user, repo, branch, path, _.bind(function (err, data) {
      if (err) return router.notify('error', t('notification.error.exists'));
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
        }
      }, this));
    }, this));
  },

  start: function() {
    if (window.authenticated) {
      $('#start').remove();

      // Redirect
      router.navigate(app.username, {trigger: true});
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
    code = (code && code === '404') ?
      t('notification.error.notFound') :
      t('notification.error.label');

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
