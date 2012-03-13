(function(config, models, views, routers, utils) {

// The Router
// ---------------

routers.Application = Backbone.Router.extend({
  initialize: function() {
    
    // Using this.route, because order matters
    this.route(":repo", 'posts', this.posts);
    this.route(/(.*\/.*)/, 'posts', this.posts);
    this.route(/(.*\/.*)\/.*\.md/, 'post', this.post);
    this.route(/(.*\/.*)\/new$/, 'new_post', this.newPost);
    this.route("", "start", app.instance.start);
  },

  extractURL: function(url) {
    url = url.split('/');
    return [
      url.slice(0, 1).join('/'), // repo
      (url.slice(1) || []).join('/') // path
    ];
  },

  // #example-repo/path/to/new
  newPost: function(url) {
    app.instance.newPost.apply(this, this.extractURL(url));
  },

  // #example-repo/path/to
  // #example-repo
  posts: function(url) {
    app.instance.posts.apply(this, this.extractURL(url));
  },

  // #example-repo/path/to/2012-01-01.md
  post: function(url) {
    app.instance.post.apply(this, this.extractURL(url));
  }
});

}).apply(this, window.args);
