var $ = require('jquery-browserify');
var _ = require('underscore');
var jsyaml = require('js-yaml');
var key = require('keymaster');
var Backbone = require('backbone');
var utils = require('.././util');

module.exports = Backbone.View.extend({

  id: 'posts',

  events: {
    'hover a.item': 'activeListing',
    'keyup #filter': 'search'
  },

  initialize: function () {
    if (!window.shortcutsRegistered) {
      key('enter', _.bind(function (e, handler) {
        this.goToFile();
      }, this));
      key('up, down', _.bind(function (e, handler) {
        this.pageListing(handler.key);
        e.preventDefault();
        e.stopPropagation();
      }, this));
      window.shortcutsRegistered = true;
    }
  },

  render: function () {
    var that = this;
    var data = _.extend(this.model, app.state, {
      currentPath: app.state.path
    });

    // Ping `views/app.js` to let know we should swap out the sidebar
    this.eventRegister = app.eventRegister;
    this.eventRegister.trigger('sidebarContext', data, 'posts');
    var isPrivate = app.state.isPrivate ? 'private' : '';

    var header = {
      avatar: '<span class="icon round repo ' + isPrivate + '"></span>',
      parent: data.user,
      parentUrl: data.user,
      title: data.repo,
      titleUrl: data.user + '/' + data.repo,
      alterable: false
    };

    this.eventRegister.trigger('headerContext', header);

    var tmpl = _(window.app.templates.posts).template();
    $(this.el).empty().append(tmpl(data));

    _.delay(function () {
      that.renderResults();
      $('#filter').focus();
      utils.shadowScroll($('#files'), $('.breadcrumb'));
      utils.shadowScroll($('#files'), $('.content-search'));
    }, 1);

    return this;
  },

  pageListing: function (handler) {

    var item, index;

    if ($('.item').hasClass('active')) {
      index = parseInt($('.item.active').data('index'), 10);
      $('.item.active').removeClass('active');

      if (handler === 'up') {
        item = index - 1;
        $('.item[data-index=' + item + ']').addClass('active');
      } else {
        item = index + 1;
        $('.item[data-index=' + item + ']').addClass('active');
      }
    } else {
      $('.item[data-index=0]').addClass('active');
    }
  },

  goToFile: function () {
    var path = $('.item.active').attr('href');
    router.navigate(path, true);
  },

  search: function (e) {
    if (e.which === 27) { // ESC
      _.delay(_.bind(function () {
        $('#filter', this.el).val('');
        this.model = window.app.models.getFiles(this.model.tree, app.state.path, '');
        this.renderResults();
      }, this), 10);

    } else if (e.which === 40 && $('.item').length > 0) {
      this.pageListing('down'); // Arrow Down
      e.preventDefault();
      e.stopPropagation();
      $('#filter').blur();

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
    var data = this.model;
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
        console.log(_.isMedia(_.extension(f.name)));
        $files.append(files({
          index: i,
          extension: _.extension(f.name),
          isMedia: _.isMedia(this.extension),
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
    $listings = $('.item', this.el);
    $listing = $(e.target, this.el);

    $listings.removeClass('active');
    $listing.addClass('active');
  }
});
