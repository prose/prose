var Backbone = require('backbone');
var config = require('../config');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    this.url = config.api + '/users/' + attributes.owner.login + '/' + 
      attributes.repo + '/commits/' + attributes.sha;
    Backbone.Model.apply(this, arguments);
  }
});
