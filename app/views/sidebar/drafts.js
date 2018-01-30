var $ = require('jquery-browserify');
var _ = require('lodash');
var Backbone = require('backbone');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({
  className: 'inner',

  template: templates.sidebar.drafts,

  initialize: function(options) {
    this.link = options.link;
    this.sidebar = options.sidebar;
  },

  render: function() {
    this.$el.html(_.template(this.template, {
      variable: 'link'
    })(this.link));

    this.sidebar.open();

    return this;
  }
});
