var Backbone = require('backbone');
var File = require('../models/file');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: File,

  constructor: function(models, options) {
    this.url = config.api + '/repos/' + options.owner + '/' + 
      options.repo + '/contents/' + options.path;
    Backbone.Collection.apply(this, arguments);
  },

  initialize: function(models, options) {
    this.fetch({ reset: true });
  }
});
