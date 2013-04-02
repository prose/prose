(function(config, models, views, routers, utils) {

// The Router
// ---------------

routers.Application = Backbone.Router.extend({
  initialize: function() {
    // Using this.route, because order matters
    this.route(/(.*\/.*)/, 'path', this.path);
    this.route(":user", 'user', this.profile);
    this.route(":user/:repo", 'repo', this.repo);
    this.route("", "start", this.start);
  },

  start: function() {
    if (confirmExit()) {
      app.state = {
        user: "",
        repo: "",
        mode: "",
        branch: "",
        path: ""
      };
      app.instance.start();
    }
  },

  extractURL: function(url) {
    url = url.split('/');
    app.state = {
      user: url[0],
      repo: url[1],
      mode: url[2],
      branch: url[3],
      path: (url.slice(4) || []).join('/')
    };
    return app.state;
  },

  path: function(url) {
    var url = this.extractURL(url);
    if (url.mode === "tree") {
      app.instance.posts(url.user, url.repo, url.branch, url.path);
    } else if (url.mode === "new") {
      app.instance.newPost(url.user, url.repo, url.branch, url.path);
    } else if (url.mode === "preview") {
      var parts = _.extractFilename(url.path);
      app.state.file = parts[1];
      app.instance.preview(url.user, url.repo, url.branch, parts[0], parts[1], url.mode);
    } else {
      var parts = _.extractFilename(url.path);
      app.state.file = parts[1];
      app.instance.post(url.user, url.repo, url.branch, parts[0], parts[1], url.mode);
    }
  },

  // #example-user/example-repo
  repo: function(username, reponame) {
    app.state = {
      user: username,
      repo: reponame,
      mode: "tree",
      branch: "",
      path: ""
    };
    app.instance.posts(username, reponame);
  },

  // #example-user
  // #example-organization
  profile: function(username) {
    if (confirmExit()) {
      app.state = {
        user: username,
        repo: "",
        mode: "",
        branch: "",
        path: ""
      };
      app.instance.profile(username);
    }
  }
});

}).apply(this, window.args);
