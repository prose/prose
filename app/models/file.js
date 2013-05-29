var Backbone = require('backbone');
var config = require('../config');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    this.url = config.api + '/repos/' + attributes.owner.login + '/' + 
      attributes.repo + '/contents/' + attributes.path;
    Backbone.Model.apply(this, arguments);
  }
});
