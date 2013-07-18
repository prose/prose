var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');
var auth = require('../config');

module.exports = Backbone.View.extend({
  id: 'start',

  template: templates.start,

  render: function() {
    this.$el.html(_.template(this.template, auth, { variable: 'auth' }));
    return this;
  }
});
