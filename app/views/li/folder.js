var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var Files = require('../../collections/files');
var File = require('../../models/file');
var Folder = require('../../models/folder');
var FileView = require('.././li/file');
var FolderView = require('.././li/folder');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({
  tagName: 'li',
  
  subviews: {},

  className: 'item clearfix',
  
  events: {
    'click .details:first': 'toggle'
  },

  template: templates.li.folder,

  initialize: function(options) {
    this.model = options.model;
    this.repo = options.repo;
    this.branch = options.branch;
    this.closed = true;

    this.$el.attr('data-index', options.index);
    this.$el.attr('data-navigate', '#' + this.repo.get('owner').login + '/' +
      this.repo.get('name') + '/tree/' + this.branch + '/' +
      this.model.get('path'));
              
    this.initSubviews(options);
    
        
  },
  
  toggle: function(e) {
    e.stopPropagation();
    e.preventDefault();
    
    this.closed ? this.toggleOpen() : this.toggleClose();
    
  },
  
  toggleOpen: function(){
    this.closed = false;
    this.$el.find('.glyphicon-folder-close').removeClass('glyphicon-folder-close').addClass('glyphicon-folder-open');
    this.$el.addClass('open-folder');
  },
  
  toggleClose: function(){
    this.closed = true;
    this.$el.find('.glyphicon-folder-open').removeClass('glyphicon-folder-open').addClass('glyphicon-folder-close');
    this.$el.removeClass('open-folder');
  },
    
  initSubviews: function(options) {
      
    var files = this.model.get('tree');
    var sha = this.model.get('sha');
              
    this.files = new Files([], {
      repo: this.repo,
      branch: this,
      sha: sha
    });
        
    for (var i=0;i<files.length;i++) { 
      var file = files[i];
      // ignore hidden files
      if ( file.name.indexOf('.') == 0 ) {
        continue;
      }
      file.collection = this.files;
      var model = (file.type == 'tree') ? new Folder(file, options) : new File(file, options);
      this.files.add(model);
    }
        
    var collection = this.files;
    
    var that = this;
    
    collection.each((function(file, index) {

      fileOpts = {
        model: file,
        branch: that.branch,
        repo: that.repo,
        history: options.history,
        router: options.router
      }
      
      var view = (file instanceof File) ? new FileView(fileOpts) : new FolderView(fileOpts);

      this.subviews[file.id] = view;
      
    }).bind(this));
                  
  },
  
  addFile: function(file, options) {
    
    file.collection = this.files;
    var model = (file.type == 'tree') ? new Folder(file, options) : new File(file, options);
    this.files.add(model);
    
    var that = this;
  
    fileOpts = {
      model: model,
      branch: that.branch,
      repo: that.repo,
      history: options.history,
      router: options.router
    }
    
    var view = (model instanceof File) ? new FileView(fileOpts) : new FolderView(fileOpts);
    
    this.subviews[model.id] = view;
    
  },
  
  renderSubviews: function() {

    var frag = document.createDocumentFragment();
    var collection = this.files;        
    var that = this;
    
    collection.each((function(file, index) {
      var view = that.subviews[file.id];
      frag.appendChild(view.render().el);
    }));
    
    this.$el.find('ul').html(frag);    
    
  },

  render: function() {
    var data = _.extend(this.model.attributes, {
      branch: this.branch,
      repo: this.repo.attributes
    });

    this.$el.empty().append(_.template(this.template, data, {
      variable: 'folder'
    }));
    
    this.renderSubviews();

    return this;
  }
});
