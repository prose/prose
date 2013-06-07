var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  id: 'orgs',

  template: _.template(templates.sidebar.orgs),

  initialize: function(options) {
    this.model = options.model;
    this.listenTo(this.model, 'reset', this.render, this);
  },

  render: function() {
    this.$el.html(this.template({ user: this.model.user.toJSON(), orgs: this.model.toJSON() }));
    return this;
  }
});
