var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');

var User = require('./models/user');
var Users = require('./collections/users');

var Repo = require('./models/repo');
var File = require('./models/file');

var AppView = require('./views/app');
var StartView = require('./views/start');
var ProfileView = require('./views/profile');
var SearchView = require('./views/search');
var ReposView = require('./views/repos');
var RepoView = require('./views/repo');
var FileView = require('./views/file');
var DocumentationView = require('./views/documentation');
var ChooseLanguageView = require('./views/chooselanguage');

var templates = require('../dist/templates');
var util = require('./util');

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
    options = _.clone(options) || {};

    this.users = new Users();

    if (options.user) {
      this.user = options.user;
      this.users.add(this.user);
    }

    // Load up the main layout
    this.app = new AppView({
      el: '#prose',
      model: {},
      user: this.user
    });

    this.app.render();
  },

  chooseLanguage: function() {
    this.minimalPage();
    var view = new ChooseLanguageView().render();
    $('#main').empty().append(view.el);
  },

  about: function() {
    this.minimalPage();
    var view = new DocumentationView().render();

    console.log(view);
    $('#main').empty().append(view.el);
  },

  minimalPage: function() {
    this.app.render({
      nomenu: true
    });
  },

  // #example-user
  // #example-organization
  profile: function(login) {
    if (this.view) this.view.remove();

    util.loader.loading(t('loading.repos'));
    this.app.nav.mode('repos');

    var user = this.users.findWhere({ login: login });
    if (_.isUndefined(user)) {
      user = new User({ login: login });
      this.users.add(user);
    }

    var search = new SearchView({
      model: user.repos
    });

    var repos = new ReposView({
      model: user.repos,
      search: search
    });

    var content = new ProfileView({
      auth: this.user,
      user: user,
      search: search,
      sidebar: this.app.sidebar,
      repos: repos
    });

    user.fetch({
      success: (function() {
        this.view = content;
        this.app.$el.find('#main').html(this.view.render().el);

        user.repos.fetch();

        // TODO: build event-driven loader queue
        util.loader.loaded();
      }).bind(this)
    });
  },

  // #example-user/example-repo
  // #example-user/example-repo/tree/example-branch/example-path
  repo: function(login, repoName, branch, path) {
    if (this.view) this.view.remove();

    util.loader.loading(t('loading.repo'));
    this.app.nav.mode('repo');

    var user = this.users.findWhere({ login: login });
    if (_.isUndefined(user)) {
      user = new User({ login: login });
      this.users.add(user);
    }

    var repo = user.repos.findWhere({ name: repoName });
    if (_.isUndefined(repo)) {
      repo = new Repo({
        name: repoName,
        owner: {
          login: login
        }
      });
      user.repos.add(repo);
    }

    repo.fetch({
      success: (function(model, res, options) {
        var content = new RepoView({
          user: user,
          model: repo,
          branch: branch,
          path: path,
          router: this,
          sidebar: this.app.sidebar
        });

        this.view = content;
        this.app.$el.find('#main').html(this.view.el);
      }).bind(this)
    });

    util.loader.loaded();
  },

  path: function(login, repoName, path) {
    var url = util.extractURL(path);
    var parts;

    switch(url.mode) {
      case 'tree':
        this.repo(login, repoName, url.branch, url.path);
        break;
      case 'preview':
        parts = util.extractFilename(url.path);
        this.preview(login, repoName, url.mode, url.branch, parts[0], parts[1]);
        break;
      case 'new':
        this.post(login, repoName, url.mode, url.branch, url.path);
        break;
      case 'blob':
      case 'edit':
        this.post(login, repoName, url.mode, url.branch, url.path);
        break;
      default:
        throw url.mode;
        break;
    }
  },

  post: function(login, repoName, mode, branch, path) {
    if (this.view) this.view.remove();

    switch(mode) {
      case 'new':
        util.loader.loading(t('loading.creating'));
        break;
      case 'edit':
        util.loader.loading(t('loading.file'));
        break;
      case 'preview':
        util.loader.loading(t('preview.file'));
        break;
    }

    this.app.nav.mode('file');

    var user = this.users.findWhere({ login: login });
    if (_.isUndefined(user)) {
      user = new User({ login: login });
      this.users.add(user);
    }

    var repo = user.repos.findWhere({ name: repoName });
    if (_.isUndefined(repo)) {
      repo = new Repo({
        name: repoName,
        owner: {
          login: login
        }
      });
      user.repos.add(repo);
    }

    var file = {
      branch: branch,
      branches: repo.branches,
      mode: mode,
      nav: this.app.nav,
      name: util.extractFilename(path)[1],
      path: path,
      repo: repo,
      router: this,
      sidebar: this.app.sidebar
    };

    // TODO: defer this success function until both user and repo have been fetched
    // in paralell rather than in series
    user.fetch({
      success: (function(model, res, options) {
        repo.fetch({
          success: (function(model, res, options) {
            if (mode === 'new') {
              file.model = new File({
                branch: branch,
                collection: repo.files,
                path: path,
                repo: repo
              });
            }

            this.view = new FileView(file);
            this.app.$el.find('#main').html(this.view.el);

            util.loader.loaded();
          }).bind(this)
        });
      }).bind(this)
    });
  },

  // TODO: should this still pass through File view?
  preview: function(user, repo, branch, path, file, mode) {
    var router = this;
    util.loader.loading(t('preview.file'));

    app.models.loadPosts(user, repo, branch, path, _.bind(function(err, data) {
      if (err) return this.notify('error', t('notification.error.exists'));
      app.models.loadPost(user, repo, branch, path, file, _.bind(function(err, data) {
        if (err) {
          app.models.emptyPost(user, repo, branch, path, _.bind(cb, this));
        } else {
          cb(err, data);
        }

        function cb(err, data) {
          var view = new app.views.Preview({
            model: data
          }).render();

          util.loader.loaded();
        }
      }, this));
    }, this));
  },

  start: function() {
    if (this.view) this.view.remove();

    // If user has authenticated
    if (this.user) {
      router.navigate(this.user.get('login'), {
        trigger: true
      });
    } else {
      this.app.nav.mode('start');
      this.view = new StartView();
      this.app.$el.html(this.view.render().el);
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

    util.loader.loaded();
    $('#content').empty().append(view.el);
  },

  notify: function(type, message) {
    // TODO Fix this, shouldn't have to pass
    // something like this here.

    // app.state.markdown = false;

    this.application.render({
      error: true
    });

    var view = new app.views.Notification({
      'type': type,
      'key': 'page-error',
      'message': message
    }).render();

    util.loader.loaded();
    $('#content').empty().append(view.el);
  }
});
