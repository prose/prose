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
    'mouseover .item a': 'parentActiveListing',
    'click .delete': 'deleteFile',
    'keyup #filter': 'search'
  },

  render: function () {
    var that = this;
    var jailed;

    // Pass a check to template whether we should
    // stagger the output of a breadcrumb trail
    if (app.state.config && app.state.config.prose && app.state.config.prose.rooturl) {
      jailed = app.state.config.prose.rooturl;
    }

    var data = _.extend(this.model, app.state, {
      currentPath: app.state.path,
      jailed: jailed
    });

    // If this repo is writable to the current user we use
    // this check to provide a deletion option to the user
    this.writePermissions = this.model.permissions && this.model.permissions.push;

    this.eventRegister = app.eventRegister;

    // Listen for button clicks from the vertical nav
    _.bindAll(this, 'remove');
    this.eventRegister.bind('remove', this.remove);

    var isPrivate = app.state.isPrivate ? ' private' : '';
    var header = {
      avatar: '<span class="icon round repo' + isPrivate +  '"></span>',
      parent: data.user,
      parentUrl: data.user,
      title: data.repo,
      titleUrl: data.user + '/' + data.repo
    };

    var pathTitle = (app.state.path) ? '/' + app.state.path : '';
    this.eventRegister.trigger('documentTitle', app.state.user + '/' + app.state.repo + pathTitle);

    this.eventRegister.trigger('sidebarContext', app.state);
    this.eventRegister.trigger('headerContext', header);

    var tmpl = _(app.templates.posts).template();
    $(this.el).empty().append(tmpl(data));

    _.delay(function () {
      that.renderResults();
      $('#filter').focus();
      utils.fixedScroll($('.topbar'));
    }, 1);

    // Render breadcrumbs
    var $breadcrumb = $('#breadcrumb', this.el);
        $breadcrumb.empty();
    var crumb = _(app.templates.breadcrumb).template();
    var trail = [data.user, data.repo, 'tree', data.branch].join('/');

    // Append the root to the breadcrumb first
    $breadcrumb.append('<a href="#' + trail + '">..</a>');

    _(utils.chunkedPath(data.path)).each(function(p) {
      if (p.name !== jailed) {
        $breadcrumb.append(crumb({
          trail: trail,
          url: p.url,
          name: p.name
        }));
      }
    });

    return this;
  },

  search: function (e) {
    if (e.which === 27) { // ESC
      _.delay(_.bind(function () {
        $('#filter', this.el).val('');
        this.model = app.models.getFiles(this.model.tree, app.state.path, '');
        this.renderResults();
      }, this), 10);
    } else if (e.which === 40 && $('.item').length > 0) {
        utils.pageListing('down'); // Arrow Down
        e.preventDefault();
        e.stopPropagation();
        $('#filter').blur();
    } else {
      _.delay(_.bind(function () {
        var searchstr = $('#filter', this.el).val();
        this.model = app.models.getFiles(this.model.tree, app.state.path, searchstr);
        this.renderResults();
      }, this), 10);
    }
  },

  renderResults: function () {
    var view = this;
    var files = _(app.templates.files).template();
    var directories = _(app.templates.directories).template();
    var data = _.extend(this.model, app.state, { currentPath: app.state.path });
    var $files = $('#files', this.el);
    $files.empty();

    _(this.model.files).each(function(f, i) {
      // Directories ..
      if (f.type === 'tree') {
        $files.append(directories({
          index: i,
          user: data.user,
          repo: data.repo,
          path: (f.path) ? '/' + f.path : '',
          branch: data.branch,
          name: (f.path === utils.parentPath(data.currentPath) ? '..' : f.name)
        }));
      } else {
        // Files ..
        $files.append(files({
          index: i,
<<<<<<< HEAD:app/views/posts.js
          extension: utils.extension(f.path),
          isBinary: utils.isBinary(utils.extension(f.path)),
          isMedia: utils.isMedia(utils.extension(f.path)),
=======
          extension: _.extension(f.path),
          isBinary: _.isBinary(_.extension(f.path)),
          isMedia: _.isMedia(_.extension(f.path)),
          isMarkdown: _.markdown(_.extension(f.path)),
>>>>>>> 86b44745b26094460faa4ea017ffd84880e444d1:src/prose/views/posts.js
          writePermissions: view.writePermissions,
          repo: data.repo,
          branch: data.branch,
          path: f.path,
          filename: utils.filename(f.name) || 'Untitled',
          file: f.path.match(/[^\/]*$/)[0],
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

  parentActiveListing: function (e) {
    $listings = $('.item', this.el);
    $listing = $(e.target, this.el).closest('li');

    $listings.removeClass('active');
    $listing.addClass('active');

    // Blur out search if its selected
    $('#filter').blur();
  },

  deleteFile: function(e) {
    var $file = $(e.target, this.el).closest('a');
    var $ico = $file.find('.ico');

    var file = {
      user: $file.data('user'),
      repo: $file.data('repo'),
      branch: $file.data('branch'),
      fileName: $file.data('file')
    };

    if (confirm(t('actions.delete.warn'))) {
      $file.addClass('working');
      $ico.addClass('saving');

      // Change the icon to a spinning one
      app.models.deletePost(file.user, file.repo, file.branch, this.model.currentPath, file.fileName, _.bind(function(err) {

        if (err) {
          $file
            .removeClass('working')
            .attr('title', t('actions.delete.error'))
            .addClass('error');

          $ico.removeClass('rubbish saving');
          return;
        }

        // On Success
        $file.closest('.item').fadeOut('fast');

        // Capture the filename and make sure the enty
        // does not exist in the model object
        for (var i = 0; i < this.model.tree.length; i++) {
          if (this.model.tree[i] && this.model.tree[i].name === file.fileName) {
            delete this.model.tree[i];
          }
        }

        // TODO Bring this back in. Currently hitting githubs api this fast
        // does not return an updated file listing.
        // router.navigate([file.user, file.repo, 'tree', file.branch].join('/'), true);
      }, this));
    }

    return false;
  }
});
