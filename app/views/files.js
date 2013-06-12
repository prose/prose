var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var FileView = require('./li/file');

module.exports = Backbone.View.extend({
  subviews: [],

  initialize: function(options) {
    this.repo = options.repo;
    this.search = options.search;
    this.branches = options.branches;
    this.branch = options.branch || this.repo.get('master_branch');
    this.subviews = [];

    this.listenTo(this.branches, 'sync', this.setModel, this);
  },

  setModel: function() {
    this.model = this.branches.findWhere({ name: this.branch }).files;
    this.search.model = this.model;

    this.listenTo(this.model, 'sync', this.render, this);
    this.listenTo(this.search, 'search', this.render, this);

    this.model.fetch();
  },

  render: function() {
    var collection = this.search ? this.search.search() : this.model;
    var frag = document.createDocumentFragment();

    collection.each((function(file, index) {
      var view = new FileView({
        model: file,
        repo: this.repo,
        branch: this.branch
      });

      frag.appendChild(view.render().el);
      this.subviews.push(view);
    }).bind(this));

    this.$el.html(frag);

    return this;
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = [];

    Backbone.View.prototype.remove.call(this);
  }
});
