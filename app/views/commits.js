var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var Commit = require('../models/commit');
var CommitView = require('./li/commit');
var templates = require('../../dist/templates');
var util = require('.././util');

module.exports = Backbone.View.extend({
  subviews: {},

  template: templates.commits,

  initialize: function(options) {
    _.bindAll(this);
    
    this.file = options.file;
    this.commits = this.file.commits;
    
    this.commits.fetch({
      success: (function(collection, res, options) {
        console.log('initcommits success')
        console.log('collection:')
        console.log(collection)
        console.log('res:')
        console.log(res)
        
        this.render();
        
      }).bind(this),
      error: (function(){
        console.log('error on initcommits fetch')
      })
    });
    
  },

  render: function(options) {
    
    var frag = document.createDocumentFragment();
        
    this.commits.each((function(commit, index) {
        
      var li = new CommitView({
        model: commit
      });
            
      frag.appendChild(li.render().el);

      this.subviews[commit.get('sha')] = li;
      
    }).bind(this));

    this.$el.find('ul').html(frag);

    return this;
  },
  
  addCommit: function(data) {
    
    console.log('adding commit');
    console.log(data)
    
    var commit = new Commit(data);
    this.commits.add(commit);
    
    var li = new CommitView({
      model: commit
    });
    
    this.subviews[commit.get('sha')] = li;
    
    this.$el.find('ul').prepend(li.render().el);
    
    
  }

});
