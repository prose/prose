var Backbone = require('backbone');
var Branch = require('../models/branch');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: Branch,

  initialize: function(models, options) {
    this.url = config.api + '/repos/' + options.owner.login + '/' +
      options.repo + '/branches';
  }
});
