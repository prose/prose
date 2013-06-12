var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var BranchesView = require('./branches');
var FilesView = require('./files');
var HeaderView = require('./header');
var SearchView = require('./search');
var utils = require('.././util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.repo),

  initialize: function(options) {
    this.user = options.user;
    this.model = options.model;
    this.router = options.router;
    this.branches = this.model.branches;
    this.subviews = [];

    this.listenTo(this.model, 'sync', this.render, this);
  },

  render: function() {
    this.$el.html(this.template({
      owner: this.model.get('owner'),
      repo: this.model.get('name'),
      branch: this.model.get('master_branch'),
      path: ''
    }));

    var header = new HeaderView({
      model: this.user,
      alterable: false
    });
    header.setElement(this.$el.find('#heading')).render();

    var search = new SearchView({});
    search.setElement(this.$el.find('#search')).render();

    var files = new FilesView({
      search: search,
      repo: this.model,
      branches: this.branches
    });

    files.setElement(this.$el.find('#files'));

    var sidebar = new BranchesView({
      model: this.branches,
      repo: this.model,
      router: this.router
    });

    sidebar.setElement(this.$el.find('#drawer'));

    this.branches.fetch();

    utils.fixedScroll(this.$el.find('.topbar'));

    this.subviews = [search, files, sidebar];

    return this;
  },

  remove: function() {
    this.subviews.each(function(subview) { subview.remove(); });
    Backbone.View.prototype.remove.call(this);
  }
});
