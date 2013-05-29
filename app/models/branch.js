var Backbone = require('backbone');
var config = require('../config');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    this.url = config.api + '/repos/' + attributes.owner.login + '/' +
      attributes.repo + '/branches/' + attributes.name;
    Backbone.Model.apply(this, arguments);
  }
});
