var Backbone = require('backbone');
var File = require('../models/file');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: File,

  initialize: function(models, options) {
    this.url = config.api + '/repos/' + options.owner.login + '/' + 
      options.repo + '/contents?ref=' + options.branch;
  }
});
