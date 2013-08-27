var $ = require('jquery-browserify');
var _ = require('underscore');
var queue = require('queue-async');
var Backbone = require('backbone');
var MergeRequests = require('../collections/merge_requests');
var MergeRequest = require('../models/merge_request');
var MergeRequestView = require('./li/merge_request');
var HeaderView = require('./header');
var util = require('.././util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  
  id: 'merge-requests',
  
  template: templates.merge_requests,

  events: {
  },

  subviews: {},

  initialize: function(options) {
    _.bindAll(this);

    var app = options.app;
    app.loader.start();

    this.app = app;
    this.path = options.path || '';
    this.router = options.router;
    this.repo = options.repo;

    // Init subviews
    this.initHeader();
    
    this.collection = new MergeRequests([],{
      repo: this.repo
    });
        
    this.collection.fetch({ complete: this.render });
    
    app.loader.done();
  },

  render: function() {
    
    console.log('merge requests render!!');
    this.$el.html(_.template(this.template, {}, {variable: 'data'}));
    this.header.setElement(this.$el.find('#heading')).render();
        
    var frag = document.createDocumentFragment();
        
    this.collection.each((function(merge_req, index) {
        
      var li = new MergeRequestView({
        model: merge_req
      });
            
      frag.appendChild(li.render().el);

      this.subviews[merge_req.get('id')] = li;
      
    }).bind(this));

    this.$el.find('ul').html(frag);
    
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
