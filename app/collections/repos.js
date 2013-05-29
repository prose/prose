var Backbone = require('backbone');
var Repo = require('../models/repo');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: Repo,

  load: function(options) {
    this.user = options.model;
    this.url = config.api + '/users/' + options.user + '/repos';
    this.fetch({
      reset: true,
      success: function(model, res, options) {
        Backbone.trigger('repos:reset', model);
      }
    });
  }
});
