var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var RepoView = require('./li/repo');

module.exports = Backbone.View.extend({
  initialize: function(options) {
    this.model = options.model;
    this.search = options.search;

    this.listenTo(this.model, 'sync', this.render, this);
    this.listenTo(this.search, 'search', this.render, this);
  },

  render: function() {
    var collection = this.search ? this.search.search() : this.model;
    var frag = document.createDocumentFragment();

    collection.each((function(repo, index) {
      var view = new RepoView({ model: repo });
      frag.appendChild(view.render().el);
    }).bind(this));

    this.$el.html(frag);

    return this;
  }
});
