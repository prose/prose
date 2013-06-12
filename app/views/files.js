var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.li.file),

  initialize: function(options) {
    this.repo = options.repo;
    this.search = options.search;
    this.branches = options.branches;
    this.branch = options.branch || this.repo.get('master_branch');

    this.listenTo(this.branches, 'sync', this.setModel, this);
    this.listenTo(this.search, 'search', this.render, this);
  },

  setModel: function() {
    this.model = this.branches.findWhere({ name: this.branch }).files;
    this.search.model = this.model;

    this.listenTo(this.model, 'sync', this.render, this);

    this.model.fetch();
  },

  render: function() {
    var collection = this.search ? this.search.search() : this.model;

    this.$el.empty();

    collection.each((function(file, index) {
      this.$el.append(this.template(_.extend(file.attributes, {
        permissions: this.repo.get('permissions')
      })));
    }).bind(this));

    return this;
  }
});
