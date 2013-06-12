var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var RepoView = require('./li/repo');

module.exports = Backbone.View.extend({
  subviews: [],

  initialize: function(options) {
    this.model = options.model;
    this.search = options.search;
    this.subviews = [];

    this.listenTo(this.model, 'sync', this.render, this);
    this.listenTo(this.search, 'search', this.render, this);
  },

  render: function() {
    var collection = this.search ? this.search.search() : this.model;
    var frag = document.createDocumentFragment();

    collection.each((function(repo, index) {
      var view = new RepoView({ model: repo });
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
