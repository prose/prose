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

    this.branch = options.branch || this.model.get('master_branch');
    this.model = options.model;
    this.nav = options.nav;
    this.path = options.path || '';
    this.router = options.router;
    this.sidebar = options.sidebar;
    this.user = options.user;

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
    this.search = new SearchView({
      mode: 'repo'
    });

    this.subviews['search'] = this.search;
    this.initFiles();
  },

  initFiles: function() {
    this.files = new FilesView({
      branch: this.branch,
      branches: this.model.branches,
      nav: this.nav,
      path: this.path,
      repo: this.model,
      router: this.router,
      search: this.search,
      sidebar: this.sidebar
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
    this.$el.html(_.template(this.template, {}, {variable: 'data'}));

    this.header.setElement(this.$el.find('#heading')).render();
    this.search.setElement(this.$el.find('#search')).render();
    this.files.setElement(this.$el.find('#files'));

    return this;
  },

  remove: function() {
    this.sidebar.close();

    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
