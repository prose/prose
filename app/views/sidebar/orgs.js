var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../../dist/templates');
var cookie = require('../../cookie');

module.exports = Backbone.View.extend({
  template: templates.sidebar.orgs,

  initialize: function(options) {
    _.bindAll(this);

    this.model = options.model;
    this.router = options.router;
    this.sidebar = options.sidebar;
    this.user = options.user;

    this.model.fetch({
      success: this.render,
      error: (function(model, xhr, options) {
        this.router.error(xhr);
      }).bind(this)
    });
  },

  render: function() {
    var orgs = {
      login: {
        user: cookie.get('login'),
        id: cookie.get('id')
      },
      user: this.user.toJSON(),
      orgs: this.model.toJSON()
    };

    this.$el.html(_.template(this.template, orgs, {
      variable: 'orgs'
    }));

    // Update active user or organization
    this.$el.find('li a').removeClass('active');
    this.$el.find('li a[data-id="' + this.user.get('id') + '"]').addClass('active');
    this.sidebar.open();

    return this;
  }
});
