var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var RepoView = require('./li/repo');

module.exports = Backbone.View.extend({
  subviews: {},

  events: {
    'mouseover .item': 'activeListing',
    'mouseover .item a': 'activeListing'
  },

  initialize: function(options) {
    _.bindAll(this);

    this.model = options.model;
    this.search = options.search;

    this.listenTo(this.search, 'search', this.render);
  },

  render: function() {
    var collection = this.search ? this.search.search() : this.model;
    var frag = document.createDocumentFragment();

    collection.each((function(repo, i) {
      var view = new RepoView({
        index: i,
        model: repo
      });

      frag.appendChild(view.render().el);
      this.subviews[repo.id] = view;
    }).bind(this));

    this.$el.html(frag);

    this.$listings = this.$el.find('.item');
    this.$search = this.$el.find('#filter');

    return this;
  },

  activeListing: function(e) {
    var $listing = $(e.target);

    if (!$listing.hasClass('item')) {
      $listing = $(e.target).closest('li');
    }

    this.$listings.removeClass('active');
    $listing.addClass('active');

    // Blur out search if its selected
    this.$search.blur();
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
