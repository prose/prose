(function(config, models, views, routers, utils, templates) {

views.Posts = Backbone.View.extend({
  events: {
    'click a.link': '_loading',
    'keyup #search_str': '_search',
    'click a.switch-branch': '_toggleBranchSelection',
    'click a.upload': '_uploadClick',
    'change #upload-input': '_upload'
  },

  _toggleBranchSelection: function() {
    this.$('.branch-wrapper .branches').toggle();
    return false;
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

  _uploadClick: function(e) {
    document.getElementById("upload-input").click();
    e.preventDefault();
  },

  _upload: function(e) {
    var fileList = document.getElementById("upload-input").files;
    var existing = '';
    var route = [app.state.user, app.state.repo, 'new', app.state.branch].join('/');

    if (fileList && fileList.length > 0) {
      app.upload = fileList[0];
      _.each(this.model.files, function(file) {
        if (file.type == 'blob' && app.upload.name == file.path.split('/').pop()) {
          existing = file.path;
        }
      })
      if (existing) {
        route = [app.state.user, app.state.repo, 'edit', app.state.branch, existing].join('/');
      }
      router.navigate(route, {trigger: true});
    }
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
      caption += ' matches'; // for "'+searchstr+'"'; // within "'+app.state.path+'/*"';
    } else {
      caption += ' files'; // within "'+ (app.state.path ? app.state.path : '/') +'"';
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
