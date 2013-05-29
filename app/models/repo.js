var Backbone = require('backbone');
var config = require('../config');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    this.url = config.api + '/users/' + attributes.owner.login + '/repo/' + 
      attributes.name;
    Backbone.Model.call(this, {
      id: attributes.id,
      name: attributes.name,
      permissions: attributes.permissions,
      private: attributes.private
    });
  }
});
