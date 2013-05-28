var $ = require('jquery-browserify');
var _ = require('underscore');
var cookie = require('../cookie');

var Backbone = require('backbone');
Backbone.sync = require('../backbone-github');

var Repos = require('../collections/repos');

module.exports = Backbone.Model.extend({
  constructor: function(attributes) {
    this.name = 'user';

    Backbone.Model.call(this, {
      avatar_url: attributes.avatar_url,
      login: attributes.login,
      name: attributes.name,
      organizations_url: attributes.organizations_url,
      repos_url: attributes.repos_url
    });
  },

  initialize: function(attributes, options) {
    this.repos = new Repos([], {
      user: this.get('login')
    })

    console.log(this);
  }
});
