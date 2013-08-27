var $ = require('jquery-browserify');
var _ = require('underscore');
var queue = require('queue-async');
var Backbone = require('backbone');
var Commit = require('../models/commit');
var HeaderView = require('./header');
var util = require('.././util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  
  id: 'commit',
  
  template: templates.commit,

  events: {
  },

  subviews: {},

  initialize: function(options) {
    _.bindAll(this);

    var app = options.app;
    app.loader.start();

    this.app = app;
    this.nav = options.nav;
    this.path = options.path || '';
    this.router = options.router;
    this.sidebar = options.sidebar;
    this.repo = options.repo;

    // Init subviews
    this.initHeader();

    // Events from sidebar
    // this.listenTo(this.sidebar, 'destroy', this.destroy);
    
    this.model = new Commit(options, { 
      repo: this.repo
    });
    
    this.model.fetch({ complete: this.render });
    
    app.loader.done();
  },

  render: function() {
    
    var data = this.model.attributes;
            
    var files = data.diffs;
    var file_frags = {};
    
    var that = this;
    
    Object.keys(files).forEach(function (filename) { 
        var file_diffs = files[filename];
        var file_html = utl.compileDiffs(file_diffs);
        var diff_hash = {};
        diff_hash['diff_html'] = file_html;
        file_frags[filename] = diff_hash;
    });
    
    data = _.extend(data, {
      files: file_frags
    });
      
    this.$el.html(_.template(this.template, data, { variable: 'data' }));

    this.header.setElement(this.$el.find('#heading')).render();

    NProgress.done();

    return this;
  },
  
  initHeader: function() {
    this.header = new HeaderView({
      repo: this.repo,
      alterable: false
    });

    this.subviews['header'] = this.header;
  }

});
