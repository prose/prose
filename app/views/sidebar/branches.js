var $ = require('jquery-browserify');
var chosen = require('chosen-jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var BranchView = require('./branch');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.sidebar.branches,

  subviews: {},

  initialize: function(options) {
    _.bindAll(this);

    this.model = options.model;
    this.repo = options.repo;
    this.branch = options.branch || this.repo.get('master_branch');
    this.router = options.router;
    this.sidebar = options.sidebar;

    this.model.fetch({ success: this.render });
  },

  render: function() {
    // only render branches selector if two or more branches
    if (this.model.length < 2) return;

    this.$el.empty().append(_.template(this.template));
    var frag = document.createDocumentFragment();

    this.model.each((function(branch, index) {
      var view = new BranchView({
        model: branch,
        repo: this.repo,
        branch: this.branch
      });

      frag.appendChild(view.render().el);
      this.subviews[branch.get('name')] = view;
    }).bind(this));

    this.$el.find('select').html(frag);

    var router = this.router;
    this.$el.find('.chzn-select').chosen().change(function() {
      router.navigate($(this).val(), true);
    });

    this.sidebar.open();

    return this;
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
