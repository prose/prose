var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var BranchesView = require('./sidebar/branches');
var FilesView = require('./files');
var HeaderView = require('./header');
var SearchView = require('./search');
var util = require('.././util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.repo),

  subviews: [],

  initialize: function(options) {
    this.user = options.user;
    this.model = options.model;
    this.branch = options.branch || this.model.get('master_branch');
    this.branches = this.model.branches;
    this.path = options.path || '';
    this.router = options.router;

    this.listenTo(this.model, 'sync', this.render, this);
  },

  render: function() {
    // TODO: load _config.yml, set parsed value on Repo model
    this.$el.html(this.template({
      owner: this.model.get('owner'),
      repo: this.model.get('name'),
      branch: this.branch,
      path: this.path,
      jailed: '',
      util: util
    }));

    var header = new HeaderView({
      user: this.user,
      alterable: false
    });
    header.setElement(this.$el.find('#heading')).render();
    this.subviews.push(header);

    var search = new SearchView({});
    search.setElement(this.$el.find('#search')).render();
    this.subviews.push(search);

    var files = new FilesView({
      search: search,
      repo: this.model,
      branch: this.branch,
      branches: this.branches,
      path: this.path
    });

    files.setElement(this.$el.find('#files'));
    this.subviews.push(files);

    var sidebar = new BranchesView({
      model: this.branches,
      repo: this.model,
      branch: this.branch,
      router: this.router
    });

    sidebar.setElement(this.$el.find('#drawer'));
    this.subviews.push(sidebar);

    this.branches.fetch();

    util.fixedScroll(this.$el.find('.topbar'));

    return this;
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = [];

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
