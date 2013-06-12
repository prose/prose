var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var BranchView = require('./branch');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.sidebar.branches),

  initialize: function(options) {
    this.model = options.model;
    this.repo = options.repo;
    this.router = options.router;
    this.branch = options.branch || this.repo.get('master_branch');
    this.subviews = [];

    this.listenTo(this.model, 'sync', this.render, this);
  },

  render: function() {
    // only render branches selector if two or more branches
    if (this.model.length < 2) return;

    this.$el.html(this.template());
    var frag = document.createDocumentFragment();

    this.subviews = [];

    this.model.each((function(branch, index) {
      var view = new BranchView({
        model: branch,
        repo: this.repo,
        branch: this.branch
      });

      frag.appendChild(view.render().el);
      this.subviews.push(view);
    }).bind(this));

    this.$el.find('select').html(frag);

    var router = this.router;
    this.$el.find('.chzn-select').chosen().change(function() {
      router.navigate($(this).val(), true);
    });

    this.$el.addClass('open');

    return this;
  },

  remove: function() {
    this.subviews.each(function(subview) { subview.remove(); });
    Backbone.View.prototype.remove.call(this);
  }
});
