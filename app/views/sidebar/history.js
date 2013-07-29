var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var CommitView = require('./li/commit');

var queue = require('queue-async');

var cookie = require('../../cookie');
var templates = require('../../../dist/templates');
var utils = require('../../util');

module.exports = Backbone.View.extend({
  subviews: {},

  template: templates.sidebar.label,

  initialize: function(options) {
    _.bindAll(this);

    var app = options.app;
    app.loader.start();

    this.app = app;
    this.branch = options.branch;
    this.commits = options.commits;
    this.repo = options.repo;
    this.router = options.router;
    this.sidebar = options.sidebar;
    this.user = options.user;
    this.view = options.view;

    this.commits.setBranch(this.branch, {
      success: this.render,
      error: (function(model, xhr, options) {
        this.router.error(xhr);
      }).bind(this),
      complete: this.app.loader.done
    });
  },

  renderFiles: function(commits, label) {
    this.app.loader.start();

    // Shallow flatten mapped array of all commit files
    var files = _.flatten(_.map(commits, function(commit) {
      return commit.get('files');
    }), true);

    /*
    // TODO: jail files to rooturl #541
    // This is difficult, as rooturl is set in Files collection
    // on a successful fetch

    if (rooturl) {
      files = files.filter(function(file) {
        return file.filename.indexOf(rooturl) === 0;
      });
    }
    */

    var map = _.groupBy(files, function(file) {
      return file.filename;
    });

    var list = _.uniq(_.map(files, function(file) {
      return file.filename;
    }));

    if (list.length) {
      // Iterate over files and build fragment to append
      var frag = document.createDocumentFragment();
      var ul = frag.appendChild(document.createElement('ul'));
      ul.className = 'listing';

      list.slice(0,5).each((function(file, index) {
        var commits = map[file];
        var commit = commits[0];

        var view = new CommitView({
          branch: this.branch,
          file: commit,
          repo: this.repo,
          view: this.view
        });

        ul.appendChild(view.render().el);

        this.subviews[commit.sha] = view;
      }).bind(this));

      var tmpl = _.template(this.template, label, { variable: 'label' });
      this.$el.append(tmpl, frag);
    }

    this.app.loader.done();
  },

  render: function(options) {
    this.app.loader.start();

    this.$el.empty();

    // Filter on commit.get('author').id === this.user.get('id')
    var id = cookie.get('id') || false;

    // Group and deduplicate commits by authenticated user
    var history = this.commits.groupBy(function(commit) {
      // Handle malformed commit data
      var author = commit.get('author') || commit.get('commit').author;
      return author && author.id === id ? 'author' : 'all';
    });

    // TODO: how many commits should be fetched initially?
    // TODO: option to load more?

    // List of recent updates by all other users
    this.history = (history.all || []).slice(0, 15);

    // Recent commits by authenticated user
    this.recent = (history.author || []).slice(0, 15);

    var q = queue();

    _.union(this.history, this.recent).each(function(commit) {
      q.defer(function(cb) {
        commit.fetch({
          success: function(model, res, options) {
            // This is necessary instead of success: cb for some reason
            cb();
          },
          error: (function(model, xhr, options) {
            this.router.error(xhr);
          }).bind(this),
        });
      });
    });

    q.awaitAll((function(err, res) {
      if (err) return err;

      this.renderFiles(this.history, 'History');
      this.renderFiles(this.recent, t('sidebar.repo.history.label'));

      this.sidebar.open();

      this.app.loader.done();
    }).bind(this));

    return this;
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
