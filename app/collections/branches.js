var Backbone = require('backbone');
var Branch = require('../models/branch');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: Branch,

  constructor: function(models, options) {
    this.url = config.api + '/repos/' + options.owner + '/' +
      options.repo + '/branches';
    Backbone.Collection.apply(this, arguments);
  },

  initialize: function(models, options) {
    this.fetch({ reset: true });
  }
});
