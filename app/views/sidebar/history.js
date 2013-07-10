var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var CommitView = require('./li/commit');

var queue = require('queue-async');

var templates = require('../../../dist/templates');
var utils = require('../../util');

module.exports = Backbone.View.extend({
  subviews: [],

  template: templates.sidebar.history,

  initialize: function(options) {
    _.bindAll(this);

    this.user = options.user;
    this.repo = options.repo;
    this.branch = options.branch;
    this.commits = options.commits;
    this.view = options.view;

    this.commits.setBranch(this.branch, {
      success: (function(model, res, options) {
        this.render();
      }).bind(this)
    });
  },

  render: function(options) {
    this.$el.empty().append(_.template(this.template));

    // Filter on commit.get('author').id === this.user.get('id')
    var id = this.user ? this.user.get('id') : false;

    // Group and deduplicate commits by authenticated user
    var history = this.commits.groupBy(function(commit) {
      // Handle malformed commit data
      var author = commit.get('author') || commit.get('commit').author;
      return author.id === id ? 'author' : 'all';
    });

    // TODO: display list of recent updates by all users
    this.history = history.all || [];

    // Recent commits by authenticated user
    this.recent = history.author || [];

    var q = queue();

    this.recent.each(function(commit) {
      q.defer(function(cb) {
        commit.fetch({
          success: function(model, res, options) {
            // TODO: Why is this necessary instead of success: cb?
            cb();
          }
        });
      });
    });

    q.awaitAll((function(err, res) {
      if (err) return err;

      // Shallow flatten mapped array of all commit files
      var files = _.flatten(_.map(this.recent, function(commit) {
        return commit.get('files');
      }), true);

      /*
      // TODO: limit files to rooturl
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

      // Iterate over files and build fragment to append
      var frag = document.createDocumentFragment();

      list.slice(0,5).each((function(file, index) {
        var commits = map[file];

        var view = new CommitView({
          branch: this.branch,
          file: commits[0],
          repo: this.repo,
          view: this.view
        });

        frag.appendChild(view.render().el);
        this.subviews.push(view);
      }).bind(this));

      this.$el.find('#commits').html(frag.list);
    }).bind(this));

    return this;
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = [];

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
