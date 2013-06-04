var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('../util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  id: 'profile',

  template: _.template(templates.profile),

  initialize: function(options) {
    this.model = options.model;
  },

  render: function() {
    this.$el.html(this.template(this.model.attributes));

    /*
    var data = this.model;
    this.eventRegister = app.eventRegister;

    // Listen for button clicks from the vertical nav
     _.bindAll(this, 'remove');
    this.eventRegister.bind('remove', this.remove);

    var header = {
      avatar: '<img src="' + data.user.avatar_url + '" width="40" height="40" alt="Avatar" />',
      parent: data.user.name || data.user.login,
      parentUrl: data.user.login,
      title: 'Explore Projects',
      titleUrl: data.user.login,
      alterable: false
    };

    this.eventRegister.trigger('documentTitle', app.state.user);
    this.eventRegister.trigger('headerContext', header);
    */

    return this;
  }
});
