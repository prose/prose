var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('../util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  id: 'header',

  template: _.template(templates.heading),

  initialize: function(options) {
    this.model = options.model;
    this.alterable = options.alterable;
  },

  render: function() {
    var login = this.model.get('login');

    this.$el.html(this.template({
      avatar: '<img src="' + this.model.get('avatar_url') + '" width="40" height="40" alt="Avatar" />',
      user: this.model.attributes,
      parent: this.model.get('name') || login,
      parentUrl: login,
      alterable: this.alterable,
      title: 'Explore Projects',
      titleUrl: login
    }));

    return this;
  }
});
