var $ = require('jquery-browserify');
var _ = require('underscore');
var jsyaml = require('js-yaml');
var key = require('keymaster');
var Backbone = require('backbone');

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
    }

    this.eventRegister.trigger('headerContext', header);
    $(this.el).empty().append(templates.posts(data));

    _.delay(function () {
      that.renderResults();
      $('#filter').focus();
      shadowScroll($('#files'), $('.breadcrumb'));
      shadowScroll($('#files'), $('.content-search'));
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
        this.model = getFiles(this.model.tree, app.state.path, '');
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
        this.model = getFiles(this.model.tree, app.state.path, searchstr);
        this.renderResults();
      }, this), 10);
    }
  },

  renderResults: function () {
    this.$('#files').html(templates.files(_.extend(this.model, app.state, {
      currentPath: app.state.path
    })));
  },

  // Creates human readable versions of _posts/paths
  semantifyPaths: function (paths) {
    return _.map(paths, function (path) {
      return {
        path: path,
        name: path
      }
    });
  },

  activeListing: function (e) {
    $listings = $('.item', this.el);
    $listing = $(e.target, this.el);

    $listings.removeClass('active');
    $listing.addClass('active');
  }
});
