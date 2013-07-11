var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var File = require('../models/file');
var Folder = require('../models/folder');
var FileView = require('./li/file');
var FolderView = require('./li/folder');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.files,

  subviews: [],

  events: {
    'mouseover .item': 'activeListing',
    'mouseover .item a': 'activeListing'
  },

  initialize: function(options) {
    _.bindAll(this);

    this.repo = options.repo;
    this.search = options.search;
    this.branches = options.branches;
    this.branch = options.branch || this.repo.get('master_branch');
    this.path = options.path || '';

    this.branches.fetch({ success: this.setModel });
  },

  setModel: function() {
    this.model = this.branches.findWhere({ name: this.branch }).files;
    this.search.model = this.model;

    this.listenTo(this.search, 'search', this.render);

    this.listenTo(this.model, 'all', function(e) {
      console.log(e);
    });

    this.model.fetch({ success: this.render, reset: true });
  },

  render: function() {
    var search = this.search && this.search.input && this.search.input.val();
    var path;
    var regex;

    if (!search) {
      path = this.path ? this.path + '/' : '';
      regex = new RegExp('^' + path + '[^\/]*$');
    }

    // if not searching, filter to only show current level
    var collection = search ? this.search.search() : this.model.filter((function(file) {
      return regex.test(file.get('path'));
    }).bind(this));

    var frag = {
      tree: document.createDocumentFragment(),
      file: document.createDocumentFragment()
    };

    this.$el.empty().append(_.template(this.template));

    collection.each((function(file, index) {
      var view;

      if (file instanceof File) {
        view = new FileView({
          model: file,
          repo: this.repo,
          branch: this.branch
        });
      } else if (file instanceof Folder) {
        view = new FolderView({
          model: file,
          repo: this.repo,
          branch: this.branch
        });
      }

      frag[file.get('type')].appendChild(view.render().el);
      this.subviews.push(view);
    }).bind(this));

    this.$el.find('.folders').html(frag.tree);
    this.$el.find('.files').html(frag.file);

    this.$listings = this.$el.find('.item');
    this.$search = this.$el.find('#filter');

    return this;
  },

  activeListing: function(e) {
    var $listing = $(e.target);

    if (!$listing.hasClass('item')) {
      $listing = $(e.target).closest('li');
    }

    this.$listings.removeClass('active');
    $listing.addClass('active');

    // Blur out search if its selected
    this.$search.blur();
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = [];

    Backbone.View.prototype.remove.call(this);
  }
});
