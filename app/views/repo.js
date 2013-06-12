var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var BranchesView = require('./branches');
var FilesView = require('./files');
var utils = require('.././util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.repo),

  initialize: function(options) {
    this.model = options.model;
    this.branches = this.model.branches;
    this.router = options.router;
    this.listenTo(this.model, 'sync', this.render, this);
  },

  render: function() {
    this.$el.html(this.template({
      owner: this.model.get('owner'),
      repo: this.model.get('name'),
      branch: this.model.get('master_branch'),
      path: ''
    }));

    debugger;

    var files = new FilesView({
      model: this.branches,
      repo: this.model
    });

    var sidebar = new BranchesView({
      model: this.branches,
      repo: this.model,
      router: this.router
    });
    
    sidebar.setElement(this.$el.find('#drawer'));
    this.branches.fetch();

    utils.fixedScroll($('.topbar'));

    return this;
  }
});
