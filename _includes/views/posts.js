(function(config, models, views, routers, utils, templates) {

views.Posts = Backbone.View.extend({
  events: {
    'change #repository_paths': '_switchPath',
  },

  initialize: function(options) {

  },

  _switchPath: function(e) {
    router.navigate(app.username + '/' + app.state.repo + '/' + app.state.branch + '/' + $(e.currentTarget).val(), true);
    return false;
  },

  // Creates human readable versions of _posts/paths
  semantifyPaths: function(paths) {

    function prettify(str) {
      if (str === "_posts") return "Uncategorized";
      var name = _.last(str.split("/"));
      return name.replace(/^./, name[0].toUpperCase());
    }

    return _.map(paths, function(path) {
      return { path: path, name: path }
    });
  },

  render: function() {
    var paths = this.semantifyPaths(app.state.paths);
    $(this.el).html(templates.posts(_.extend(this.model, app.state, {
      current_path: _.select(paths, function(p) {return p.path === app.state.path })[0],
      paths: paths
    })));
    return this;
  }
});

}).apply(this, window.args);
