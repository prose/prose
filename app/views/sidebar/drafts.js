var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({
  className: 'inner',

  template: templates.sidebar.drafts,

  initialize: function(options) {
    _.bindAll(this);

    this.link = options.link;
    this.sidebar = options.sidebar;
  },

  render: function() {
    this.$el.html(_.template(this.template, this.link, {
      variable: 'link'
    }));

    this.sidebar.open();

    return this;
  }
});
