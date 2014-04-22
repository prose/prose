var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var File = require('../models/file');
var Folder = require('../models/folder');
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
    'mouseover .item a': 'activeListing',
    'click .breadcrumb a': 'navigate',
    'click .item a': 'navigate'
  },

  initialize: function(options) {
    _.bindAll(this);

    var app = options.app;
    app.loader.start();

    this.app = app;
    this.branch = options.branch || options.repo.get('default_branch');
    this.branches = options.branches;
    this.history = options.history;
    this.nav = options.nav;
    this.path = options.path || '';
    this.repo = options.repo;
    this.router = options.router;
    this.search = options.search;
    this.sidebar = options.sidebar;

    this.branches.fetch({
      success: this.setModel,
      error: (function(model, xhr, options) {
        this.router.error(xhr);
      }).bind(this),
      complete: this.app.loader.done
    });
  },

  setModel: function() {
    this.app.loader.start();

    this.model = this.branches.findWhere({ name: this.branch }).files;

    this.model.fetch({
      success: (function() {
        // Update this.path with rooturl
        var config = this.model.config;
        this.rooturl = config && config.rooturl ? config.rooturl : '';

        this.presentationModel = this.model.filteredModel || this.model;
        this.search.model = this.presentationModel;
        // Render on fetch and on search
        this.listenTo(this.search, 'search', this.render);
        this.render();
      }).bind(this),
      error: (function(model, xhr, options) {
        this.router.error(xhr);
      }).bind(this),
      complete: this.app.loader.done,
      reset: true
    });
  },

  newFile: function() {
    var path = [
      this.repo.get('owner').login,
      this.repo.get('name'),
      'new',
      this.branch,
      this.path ? this.path : this.rooturl
    ]

    this.router.navigate(_.compact(path).join('/'), true);
  },

  render: function() {
    this.app.loader.start();

    var search = this.search && this.search.input && this.search.input.val();
    var rooturl = this.rooturl ? this.rooturl + '/' : '';
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
    // if _posts directory exists and path does not begin with _drafts
    if (this.presentationModel.get('_posts') && /^(?!_drafts)/.test(this.path)) {
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
    var collection = search ? this.search.search() : this.presentationModel.filter((function(file) {
      return regex.test(file.get('path'));
    }).bind(this));

    var frag = document.createDocumentFragment();

    collection.each((function(file, index) {
      var view;

      if (file instanceof File) {
        view = new FileView({
          branch: this.branch,
          history: this.history,
          index: index,
          model: file,
          repo: this.repo,
          router: this.router
        });
      } else if (file instanceof Folder) {
        view = new FolderView({
          branch: this.branch,
          history: this.history,
          index: index,
          model: file,
          repo: this.repo,
          router: this.router
        });
      }

      frag.appendChild(view.render().el);
      this.subviews[file.id] = view;
    }).bind(this));

    this.$el.find('ul').html(frag);

    this.app.loader.done();

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

  navigate: function(e) {
    var target = e.currentTarget;
    var path = target.href.split('#')[1];
    var match = path.match(/tree\/([^\/]*)\/?(.*)$/);

    if (e && match) {
      e.preventDefault();

      this.path = match ? match[2] : path;
      this.render();

      this.router.navigate(path);
    }
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
