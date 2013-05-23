var _ = require('underscore');
var Backbone = require('backbone');
var cookie = require('../cookie');
var config = require('./config.js');

module.exports = (function() {
  Backbone.GitHub = function() {
    var github;

    try {
      github = new Github(config);
    } catch(err) {
      throw 'GitHub init failed.'
    }

    return github;
  };

  Backbone.ajaxSync = Backbone.sync;

  // Override 'Backbone.sync' to default to Backbone.GitHub,
  // the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
  Backbone.sync = function(method, model, options) {
    return Backbone.GitHub.apply(this, [method, model, options]);
  };

  return Backbone.GitHub;
})();
