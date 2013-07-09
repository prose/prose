var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.sidebar.orgs,

  initialize: function(options) {
    this.model = options.model;
    this.listenTo(this.model, 'sync', this.render, this);
  },

  render: function() {
    var orgs = {
      user: this.model.user.toJSON(),
      memberOf: this.model.toJSON()
    };

    this.$el.empty().append(_.template(this.template, orgs, {
      variable: 'orgs'
    }));

    this.$el.addClass('open');
    return this;
  }
});
