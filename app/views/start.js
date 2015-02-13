var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');
var auth = require('../config');
var cookie = require('../cookie');

// Set scope
auth.scope = cookie.get('scope') || 'repo';

module.exports = Backbone.View.extend({
  id: 'start',

  events: {
    'click a[href="#scopes"]': 'toggleScope',
    'change .toggle-hide select': 'setScope'
  },

  template: templates.start,

  render: function() {
    this.$el.html(_.template(this.template, auth, { variable: 'auth' }));
    return this;
  },

  toggleScope: function(e) {
    e.preventDefault();
    this.$('.toggle-hide').toggleClass('show');
  },

  setScope: function(e) {
    var scope = $(e.currentTarget).val(),
        expire = new Date((new Date()).setYear((new Date()).getFullYear() + 20));
    auth.scope = scope;
    cookie.set('scope', scope, expire);
    this.render();
    router.app.nav.render();
  }
});
