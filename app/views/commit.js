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
        
    console.log('diffs');
    console.log(data.diffs);
        
    var sections = {};
    
    var section_numbers = [];
    
    var diffRegex = /<span class='idiff'>.*<\/span>/;
        
    for (var i=0; i < data.diffs.length; i++) {
      var diff = data.diffs[i];
      
      var prev_line_clean = null;
      var this_line_clean = null;
      
      var line_num = diff.line_old;
            
      if (!sections[line_num]) {
        
        // check the previous section.. if it matches, add to prev section instead
        
        // if there is a previous seciton                
        if (data.diffs[i-1]) {
                    
          var prev_line = data.diffs[i-1].line;
          var this_line = data.diffs[i].line;
          
          var prev_diff = prev_line.match(diffRegex);
          
          if (prev_diff) {
            var prev_line_clean = prev_line.replace(prev_diff[0],'').slice(1);
          }
          
          var this_diff = this_line.match(diffRegex);
        
          if (this_diff) {
            var this_line_clean = this_line.replace(this_diff[0],'').slice(1);
          }
          
        }
                
        if (this_line_clean && prev_line_clean && (this_line_clean == prev_line_clean)) {
          sections[data.diffs[i-1].line_old].segments.push(diff.line)
        } else {
          sections[line_num] = {'segments':[]};
          sections[line_num].segments.push(diff.line);
          section_numbers.push(line_num);
        }
              
      } else {
        sections[line_num].segments.push(diff.line);
      }
    }
    
    console.log('sections:');
    console.log(sections);
    
    var getCleanSection = function(segment) {
      
      var modifier = segment[0];
  
      if (modifier == "+" || modifier == "-") {
        var modifier_class = modifier == "+" ? "added" : "removed";
        clean_section = "<span class='idiff " + modifier_class + "'>" + segment.slice(1) + "</span>";
      } else {
        clean_section = segment.slice(1);
      }
      
      return clean_section
        
    }
      
    var new_sections = [];
        
    for (var i=0; i < section_numbers.length; i++) {
      var section_num = section_numbers[i];
      var section = sections[section_num];
      var span_str = "<span class='idiff'>";
      var clean_section;
      
      if (section.segments.length > 1) {
        var first_segment = section.segments[0];
    
        // cleanup first segment if modifier is inside span
        if (first_segment.substring(0,20) == span_str) {
          var modifier = first_segment[20];
          first_segment = first_segment.replace(span_str + modifier, modifier + span_str);
        }
        
        var first_diff = first_segment.match(diffRegex);
        
        if (first_diff) {
          
          var first_diff = first_segment.match(diffRegex)[0];
          var first_type = first_segment[0] == "+" ? "added" : "removed";
        
          first_diff_classed = first_diff.replace('idiff', 'idiff '+first_type);
        
          var second_segment = section.segments[1];
        
          // cleanup second segment if modifier is inside span
          if (second_segment.substring(0,20) == span_str) {
            var modifier = second_segment[20];
            second_segment = second_segment.replace(span_str + modifier, modifier + span_str);
          }
        
          var second_diff = second_segment.match(diffRegex)[0];
          var second_type = second_segment[0] == "+" ? "added" : "removed";
          
          second_diff_classed = second_diff.replace('idiff', 'idiff '+second_type);
        
          var new_str = first_segment.replace(first_diff, second_diff_classed+first_diff_classed);
        
          // get rid of the leading character
          clean_section = new_str.slice(1);
          
          new_sections.push(clean_section)
          
        } else {
          
          for (var s=0; s < section.segments.length; s++) {
            
            clean_section = getCleanSection(section.segments[s]);
            new_sections.push(clean_section);
            
          }
        
                    
        }
        
      } else {
        
        clean_section = getCleanSection(section.segments[0]);
        new_sections.push(clean_section);
                      
      }
            
    }
    
    console.log('new_secitons:');
    console.log(new_sections);
    
    data = _.extend(data, {
      sections: new_sections
    });
      
    this.$el.html(_.template(this.template, data, { variable: 'data' }));

    this.header.setElement(this.$el.find('#heading')).render();
    // this.search.setElement(this.$el.find('#search')).render();
    // this.files.setElement(this.$el.find('#files'));

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
