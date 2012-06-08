(function(config, models, views, routers, utils, templates) {

views.Posts = Backbone.View.extend({
  events: {
    'click a.link': '_loading'
  },

  initialize: function(options) {

  },

  _loading: function(e) {
    $(e.currentTarget).addClass('loading');
  },

  // Creates human readable versions of _posts/paths
  semantifyPaths: function(paths) {
    return _.map(paths, function(path) {
      return { path: path, name: path.replace('_posts/','').replace('_posts','') }
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
