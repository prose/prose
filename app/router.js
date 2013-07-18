var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');

var User = require('./models/user');
var Users = require('./collections/users');
var Orgs = require('./collections/orgs');

var Repo = require('./models/repo');
var File = require('./models/file');

var AppView = require('./views/app');
var NotificationView = require('./views/notification');
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
    if (this.view) this.view.remove();

    this.view = new ChooseLanguageView();
    this.app.$el.find('#main').html(this.view.render().el);
  },

  about: function() {
    if (this.view) this.view.remove();

    this.view = new DocumentationView();
    this.app.$el.find('#main').html(this.view.render().el);
  },

  // #example-user
  // #example-organization
  profile: function(login) {
    if (this.view) this.view.remove();

    util.documentTitle(login)
    util.loader.loading(t('loading.repos'));
    this.app.nav.mode('repos');

    var user = this.users.findWhere({ login: login });
    if (_.isUndefined(user)) {
      user = new User({ login: login });
      this.users.add(user);
    }

    var search = new SearchView({
      model: user.repos,
      mode: 'repos'
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
      success: (function(model, res, options) {
        this.view = content;
        this.app.$el.find('#main').html(this.view.render().el);

        model.repos.fetch({ success: repos.render });

        // TODO: build event-driven loader queue
        util.loader.loaded();
      }).bind(this),
      error: (function(model, xhr, options) {
        this.error(xhr);
      }).bind(this)
    });
  },

  // #example-user/example-repo
  // #example-user/example-repo/tree/example-branch/example-path
  repo: function(login, repoName, branch, path) {
    if (this.view) this.view.remove();

    var title = repoName;
    if (branch) title = repoName + ': /' + path + ' at ' + branch;
    util.documentTitle(title);
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
          branch: branch,
          model: repo,
          nav: this.app.nav,
          path: path,
          router: this,
          sidebar: this.app.sidebar,
          user: user
        });

        this.view = content;
        this.app.$el.find('#main').html(this.view.render().el);
      }).bind(this),
      error: (function(model, xhr, options) {
        this.error(xhr);
      }).bind(this)
    });

    util.loader.loaded();
  },

  path: function(login, repoName, path) {
    var url = util.extractURL(path);

    switch(url.mode) {
      case 'tree':
        this.repo(login, repoName, url.branch, url.path);
        break;
      case 'new':
      case 'blob':
      case 'edit':
      case 'preview':
        this.post(login, repoName, url.mode, url.branch, url.path);
        break;
      default:
        throw url.mode;
        break;
    }
  },

  post: function(login, repoName, mode, branch, path) {
    if (this.view) this.view.remove();

    this.app.nav.mode('file');

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
            this.view = new FileView(file);
            this.app.$el.find('#main').html(this.view.el);

            util.loader.loaded();
          }).bind(this),
          error: (function(model, xhr, options) {
            this.error(xhr);
          }).bind(this)
        });
      }).bind(this),
      error: (function(model, xhr, options) {
        this.error(xhr);
      }).bind(this)
    });
  },

  preview: function(login, repoName, mode, branch, path) {
    if (this.view) this.view.remove();

    util.loader.loading(t('preview.file'));

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

    repo.fetch({
      success: (function(model, res, options) {
        // TODO: should this still pass through File view?
        this.view = new Preview(file);
        this.app.$el.find('#main').html(this.view.el);

        util.loader.loaded();
      }).bind(this),
      error: (function() {
        this.notify('error', t('notification.error.exists'));
      }).bind(this)
    });
  },

  start: function() {
    if (this.view) this.view.remove();

    // If user has authenticated
    if (this.user) {
      router.navigate(this.user.get('login'), {
        trigger: true,
        replace: true
      });
    } else {
      this.app.nav.mode('start');
      this.view = new StartView();
      this.app.$el.html(this.view.render().el);
    }
  },

  notify: function(message, options) {
    if (this.view) this.view.remove();

    this.view = new NotificationView({
      'message': message,
      'options': options
    });

    this.app.$el.find('#main').html(this.view.render().el);
    util.loader.loaded();
  },

  error: function(xhr) {
    var message = [
      xhr.status,
      xhr.statusText
    ].join(' ');

    var error = JSON.parse(xhr.responseText).message;

    var options = [
      {
        'title': t('notification.home'),
        'link': '/'
      }
    ];

    this.notify(message, options)
  }
});
