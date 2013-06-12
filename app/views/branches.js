var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.sidebar.branches),

  initialize: function(options) {
    this.model = options.model;
    this.repo = options.repo;
    this.branch = options.branch || this.repo.get('master_branch');
    this.router = options.router;
    this.listenTo(this.model, 'sync', this.render, this);
  },

  render: function() {
    // only render branches selector if two or more branches
    if (this.model.length < 2) return;

    this.$el.html(this.template());

    var tmpl = _.template(templates.sidebar.branch);
    this.model.each((function(branch, index) {
      this.$el.find('select').append(tmpl(_.extend(branch.attributes, {
        selected: this.branch && this.branch === branch.get('name')
      })));
    }).bind(this));

    this.$el.find('.chzn-select').chosen().change(function() {
      this.router.navigate($(this).val(), true);
    });

    this.$el.addClass('open');

    return this;
  }
});
