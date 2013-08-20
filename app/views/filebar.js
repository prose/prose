var _ = require('underscore');
var Backbone = require('backbone');
var File = require('../models/file');
var Folder = require('../models/folder');
var FileView = require('./li/file');
var FolderView = require('./li/folder');
var templates = require('../../dist/templates');
var util = require('.././util');

module.exports = Backbone.View.extend({
  template: templates.filebar,
  
  subviews: {},
  
  events: {
    'click a.new': 'create'
  },

  initialize: function(options) {
    _.bindAll(this);
    
    var app = options.app;
    
    this.$els = {};
    
    this.app = app;
    this.branch = options.branch || options.repo.get('master_branch');
    this.branches = options.branches;
    this.history = options.history;
    this.path = options.path || '';
    this.repo = options.repo;
    this.router = options.router;
    this.sidebar = options.sidebar;
    this.currentFile = options.currentFile;
    
    this.branches.fetch({
      success: this.setModel,
      error: (function(model, xhr, options) {
        this.router.error(xhr);
      }).bind(this)
    });
    
  },
  
  setModel: function() {
    
    this.model = this.branches.findWhere({ name: this.branch }).files;

    this.model.fetch({
      success: (function() {
        // Update this.path with rooturl
        var config = this.model.config;
        this.rooturl = config && config.rooturl ? config.rooturl : '';

        this.render();
        
        this.setCurrentFile(this.currentFile);
        
      }).bind(this),
      error: (function(model, xhr, options) {
        this.router.error(xhr);
      }).bind(this),
      complete: this.app.loader.done,
      reset: true
    });
  },

  render: function(options) {
    
    var rooturl = this.rooturl ? this.rooturl + '/' : '';
    var path = this.path ? this.path + '/' : '';
    var drafts;
    
    var url = [
      this.repo.get('owner').login,
      this.repo.get('name'),
      'tree',
      this.branch
    ].join('/');
    
    var name = this.repo.get('full_name');

    // Set rooturl jail from collection config
    var regex = new RegExp('^' + (path ? path : rooturl) + '[^\/]*$');

    // Render drafts link in sidebar as subview
    // if _posts directory exists and path does not begin with _drafts
    if (this.model.get('_posts') && /^(?!_drafts)/.test(this.path)) {
      drafts = this.sidebar.initSubview('drafts', {
        link: [url, '_drafts'].join('/'),
        sidebar: this.sidebar
      });

      this.subviews['drafts'] = drafts;
      drafts.render();
    }
    

    var data = {
      project_name: name,
      path: path,
      parts: util.chunkedPath(this.path),
      rooturl: rooturl,
      url: url
    };

    this.$el.html(_.template(this.template, data, {variable: 'data'}));
    
    // if not searching, filter to only show current level
    var collection = this.model.filter((function(file) {
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
  
  makeCurrentDirty: function() {
    this.$els.currentFile.addClass('dirty-file');
  },
  
  makeCurrentClean: function() {
    this.$els.currentFile.removeClass('dirty-file');
  },
  
  setCurrentFile: function(targetFile) {
    this.currentFile = targetFile;
    var activePath = this.currentFile.get('path');
    this.$els.currentFile = this.$el.find('[data-path="' + activePath + '"]');
    this.$els.currentFile.addClass('current');
  },

  open: function() {
    this.$el.toggleClass('open', true);
  },

  close: function() {
    this.$el.toggleClass('open', false);
  },

  toggle: function() {
    this.$el.toggleClass('open');
  },

  toggleMobile: function() {
    this.$el.toggleClass('mobile');
  },

  mode: function(mode) {
    // Set data-mode attribute to toggle nav buttons in CSS
    this.$el.attr('data-sidebar', mode);
  },
  
  create: function() {
    
    var path = [
      this.repo.get('owner').login,
      this.repo.get('name'),
      'new',
      this.branch,
      this.path ? this.path : this.rooturl
    ]

    this.router.navigate(_.compact(path).join('/'), true);
    
    return false;
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
