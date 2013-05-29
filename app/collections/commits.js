var Backbone = require('backbone');
var Commit = require('../models/commit');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: Commit,

  constructor: function(models, options) {
    this.url = config.api + '/users/' + options.owner + '/' + 
      options.repo + '/commits';
    Backbone.Collection.apply(this, arguments);
  },

  initialize: function(models, options) {
    this.fetch({ reset: true });
  }
});
