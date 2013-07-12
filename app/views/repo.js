var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var FilesView = require('./files');
var HeaderView = require('./header');
var SearchView = require('./search');
var util = require('.././util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.repo,

  subviews: {},

  initialize: function(options) {
    _.bindAll(this);

    this.user = options.user;
    this.model = options.model;
    this.branch = options.branch || this.model.get('master_branch');
    this.path = options.path || '';
    this.router = options.router;
    this.sidebar = options.sidebar;

    // Init subviews
    this.initHeader();
    this.initSearch();
    this.initBranches();
    this.initHistory();

    // Events from sidebar
    this.listenTo(this.sidebar, 'destroy', this.destroy);
    this.listenTo(this.sidebar, 'cancel', this.cancel);
    this.listenTo(this.sidebar, 'confirm', this.updateFile);
  },

  initHeader: function() {
    this.header = new HeaderView({
      repo: this.model,
      alterable: false
    });

    this.subviews['header'] = this.header;
  },

  initSearch: function() {
    this.search = new SearchView({});
    this.subviews['search'] = this.search;

    this.initFiles();
  },

  initFiles: function() {
    this.files = new FilesView({
      search: this.search,
      repo: this.model,
      branch: this.branch,
      branches: this.model.branches,
      path: this.path
    });

    this.subviews['files'] = this.files;
  },

  initBranches: function() {
    this.branches = this.sidebar.initSubview('branches', {
      model: this.model.branches,
      repo: this.model,
      branch: this.branch,
      router: this.router,
      sidebar: this.sidebar
    });

    this.subviews['branches'] = this.branches;
  },

  initHistory: function() {
    this.history = this.sidebar.initSubview('history', {
      user: this.user,
      repo: this.model,
      branch: this.branch,
      commits: this.model.commits,
      sidebar: this.sidebar,
      view: this
    });

    this.subviews['history'] = this.history;
  },

  render: function() {
    var repo = {
      owner: this.model.get('owner'),
      repoName: this.model.get('name'),
      branch: this.branch,
      path: this.path,
      pathParts: util.chunkedPath(this.path)
    };

    this.$el.html(_.template(this.template, repo, {variable: 'repo'}));

    this.header.setElement(this.$el.find('#heading')).render();
    this.search.setElement(this.$el.find('#search')).render();
    this.files.setElement(this.$el.find('#files'));

    util.fixedScroll(this.$el.find('.topbar'));

    return this;
  },

  remove: function() {
    this.sidebar.close();

    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
