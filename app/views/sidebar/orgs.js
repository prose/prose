var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.sidebar.orgs,

  initialize: function(options) {
    this.model = options.model;
    this.user = options.user;
  },

  render: function() {
    var data = {
      user: this.model.user.toJSON(),
      orgs: this.model.toJSON()
    };

    this.$el.html(_.template(this.template, data, {
      variable: 'data'
    }));

    // Update active user or organization
    this.$el.find('li a').removeClass('active');
    this.$el.find('li a[data-id="' + this.user.get('id') + '"]').addClass('active');

    return this;
  }
});
