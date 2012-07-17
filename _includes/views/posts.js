(function(config, models, views, routers, utils, templates) {

views.Posts = Backbone.View.extend({
  events: {
    'click a.link': '_loading',
    'keypress #search_str': '_search',
    'change #search_str': '_search'
  },

  initialize: function(options) {

  },

  _search: function() {
    _.delay(_.bind(function() {
      var searchstr = this.$('#search_str').val();
      this.model = getFiles(this.model.tree, app.state.path, searchstr);
      this.renderResults();      
    }, this), 10);
  },

  _loading: function(e) {
    $(e.currentTarget).addClass('loading');
  },

  // Creates human readable versions of _posts/paths
  semantifyPaths: function(paths) {
    return _.map(paths, function(path) {
      return { path: path, name: path }
    });
  },

  renderResults: function() {
    this.$('#files').html(templates.files(_.extend(this.model, app.state, {
      current_path: app.state.path
    })));

    var caption = this.model.files.length+'';
    var searchstr = this.$('#search_str').val();
    if (searchstr) {
      caption += ' matches for "'+searchstr+'" within "'+app.state.path+'/*"';
    } else {
      caption += ' files within "'+ (app.state.path ? app.state.path : '/') +'"';
    }
    this.$('.results').html(caption);
  },

  render: function() {
    var that = this;
    $(this.el).html(templates.posts(_.extend(this.model, app.state, {
      current_path: app.state.path
    })));

    _.delay(function() {
      that.renderResults();
      $('#search_str').focus();
    }, 1);
    return this;
  }
});

}).apply(this, window.args);
