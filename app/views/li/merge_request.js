var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../../dist/templates');
var util = require('../../util');
var moment = require('moment');

module.exports = Backbone.View.extend({
  template: templates.li.merge_request,

  tagName: 'li',

  className: 'commit-item clearfix',

  events: {
    // 'click a.delete': 'destroy'
  },

  initialize: function(options) {
    this.model = options.model;
  },

  render: function() {
    
    // var time = this.model.get('commit_details').committer.date;
    // var committed_at = moment(time).format("MMM D YYYY, h:mm A");
    // var timeago = moment(time).fromNow();
        
    var data = _.extend(this.model.attributes, {
      // time: committed_at,
      // timeago: timeago,
      link: this.model.link()
    });

    this.$el.html(_.template(this.template, data, {
      variable: 'merge_req'
    }));

    return this;
  }

});
