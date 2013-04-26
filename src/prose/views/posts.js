var $ = require('jquery-browserify');
var _ = require('underscore');
var jsyaml = require('js-yaml');
var key = require('keymaster');
var Backbone = require('backbone');
var utils = require('.././util');

module.exports = Backbone.View.extend({

  id: 'posts',

  events: {
    'mouseover .item': 'activeListing',
    'click .delete': 'deleteFile',
    'keyup #filter': 'search'
  },

  render: function () {
    var that = this;
    var data = _.extend(this.model, app.state, {
      currentPath: app.state.path
    });

    key('enter, o', _.bind(function(e, handler) {
      utils.goToFile();
    }, this));
    key('j, k', _.bind(function(e, handler) {
      utils.pageListing(handler.key);
    }, this));

    // console.log(data);
    var isPrivate = app.state.isPrivate ? ' private' : '';
    var isBelonging = '';

    if (data.user !== app.username && data.permissions.push === true) {
      isBelonging = ' owner';
    } 

    var header = {
      avatar: '<span class="icon round repo' + isPrivate + isBelonging +  '"></span>',
      parent: data.user,
      parentUrl: data.user,
      title: data.repo,
      titleUrl: data.user + '/' + data.repo,
      alterable: false
    };

    app.eventRegister.trigger('sidebarContext', app.state, 'posts');
    app.eventRegister.trigger('headerContext', header);

    var tmpl = _(window.app.templates.posts).template();
    $(this.el).empty().append(tmpl(data));

    _.delay(function () {
      that.renderResults();
      $('#filter').focus();
      utils.fixedScroll($('.topbar'));
    }, 1);

    return this;
  },

  search: function (e) {
    if (e.which === 27) { // ESC
      _.delay(_.bind(function () {
        $('#filter', this.el).val('');
        this.model = window.app.models.getFiles(this.model.tree, app.state.path, '');
        this.renderResults();
      }, this), 10);
    } else {
      _.delay(_.bind(function () {
        var searchstr = $('#filter', this.el).val();
        this.model = window.app.models.getFiles(this.model.tree, app.state.path, searchstr);
        this.renderResults();
      }, this), 10);
    }
  },

  renderResults: function () {
    var files = _(window.app.templates.files).template();
    var directories = _(window.app.templates.directories).template();
    var data = _.extend(this.model, app.state, { currentPath: app.state.path });
    var $files = $('#files', this.el);
    $files.empty();

    _(this.model.files).each(function(f, i) {
      if (f.type === 'tree') {
        $files.append(directories({
          index: i,
          user: data.user,
          repo: data.repo,
          path: (f.path) ? '/' + f.path : '',
          branch: data.branch,
          name: (f.path === _.parentPath(data.currentPath) ? '..' : f.name)
        }));
      } else {
        $files.append(files({
          index: i,
          extension: _.extension(f.name),
          isBinary: _.isBinary(_.extension(f.name)),
          isMedia: _.isMedia(_.extension(f.name)),
          repo: data.repo,
          branch: data.branch,
          path: f.path,
          filename: _.filename(f.name) || 'Untitled',
          name: f.name,
          user: data.user
        }));
      }
    });
  },

  // Creates human readable versions of _posts/paths
  semantifyPaths: function (paths) {
    return _.map(paths, function (path) {
      return {
        path: path,
        name: path
      };
    });
  },

  activeListing: function (e) {
    if ($(e.target, this.el).hasClass('item')) {
      $listings = $('.item', this.el);
      $listing = $(e.target, this.el);

      $listings.removeClass('active');
      $listing.addClass('active');

      // Blur out search if its selected
      $('#filter').blur();
    }
  },

  deleteFile: function(e) {
    var $file = $(e.target, this.el);
    var file = {
      user: $file.data('user'),
      repo: $file.data('repo'),
      branch: $file.data('branch'),
      fileName: $file.data('file')
    }

    if (confirm('Are you sure you want to delete that file?')) {
      window.app.models.deletePost(file.user, file.repo, file.branch, this.model.currentPath, file.fileName, _.bind(function (err) {
        if (err) return alert('Error during deletion. Please wait 30 seconds and try again.');
        router.navigate([file.user, file.repo, 'tree', file.branch].join('/'), true);
      }, this));
    }

    return false;
  },

  remove: function() {
    // Cleanup
    key.unbind('enter, o')
    key.unbind('j, k');
  }
});
