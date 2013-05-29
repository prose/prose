var Backbone = require('backbone');
var Repo = require('../models/repo');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: Repo,

  constructor: function(models, options) {
    this.url = config.api + '/users/' + options.user + '/repos';
    Backbone.Collection.apply(this, arguments);
  },

  initialize: function(models, options) {
    this.fetch();
  }
});
