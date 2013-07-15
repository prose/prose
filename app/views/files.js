var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var File = require('../models/file');
var Folder = require('../models/folder');
var DraftsView = require('./sidebar/drafts');
var FileView = require('./li/file');
var FolderView = require('./li/folder');
var templates = require('../../dist/templates');
var util = require('.././util');

module.exports = Backbone.View.extend({
  className: 'listings',

  template: templates.files,

  subviews: {},

  events: {
    'mouseover .item': 'activeListing',
    'mouseover .item a': 'activeListing'
  },

  initialize: function(options) {
    _.bindAll(this);

    this.branch = options.branch || options.repo.get('master_branch');
    this.branches = options.branches;
    this.path = options.path || '';
    this.repo = options.repo;
    this.search = options.search;
    this.sidebar = options.sidebar;

    this.branches.fetch({ success: this.setModel });
  },

  setModel: function() {
    this.model = this.branches.findWhere({ name: this.branch }).files;
    this.search.model = this.model;

    this.listenTo(this.search, 'search', this.render);

    this.model.fetch({ success: this.render, reset: true });
  },

  render: function() {
    var search = this.search && this.search.input && this.search.input.val();
    var config = this.model.config;
    var rooturl = config ? config.rooturl + '/' : '';
    var path = this.path ? this.path + '/' : '';
    var drafts;

    var url = [
      this.repo.get('owner').login,
      this.repo.get('name'),
      'tree',
      this.branch
    ].join('/');

    // Set rooturl jail from collection config
    var regex = new RegExp('^' + (path ? path : rooturl) + '[^\/]*$');

    // Render drafts link in sidebar as subview
    if (rooturl && this.path !== '_drafts') {
      drafts = this.sidebar.initSubview('drafts', {
        link: [url, '_drafts'].join('/'),
        sidebar: this.sidebar
      });

      this.subviews['drafts'] = drafts;
      drafts.render();
    }

    var data = {
      path: path,
      parts: util.chunkedPath(this.path),
      rooturl: rooturl,
      url: url
    };

    this.$el.html(_.template(this.template, data, {variable: 'data'}));

    // if not searching, filter to only show current level
    var collection = search ? this.search.search() : this.model.filter((function(file) {
      return regex.test(file.get('path'));
    }).bind(this));

    var frag = document.createDocumentFragment();

    collection.each((function(file, index) {
      var view;

      if (file instanceof File) {
        view = new FileView({
          model: file,
          index: index,
          repo: this.repo,
          branch: this.branch
        });
      } else if (file instanceof Folder) {
        view = new FolderView({
          model: file,
          index: index,
          repo: this.repo,
          branch: this.branch
        });
      }

      frag.appendChild(view.render().el);
      this.subviews[file.id] = view;
    }).bind(this));

    this.$el.find('ul').html(frag);

    return this;
  },

  activeListing: function(e) {
    var $listing = $(e.target);

    if (!$listing.hasClass('item')) {
      $listing = $(e.target).closest('li');
    }

    this.$el.find('.item').removeClass('active');
    $listing.addClass('active');

    // Blur out search if its selected
    this.search.$el.blur();
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = {};
    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
