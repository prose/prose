var Backbone = require('backbone');
var config = require('../config');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    this.url = config.api + '/users/' + attributes.owner.login + '/repo/' + 
      attributes.name;
    Backbone.Model.call(this, {
      id: attributes.id,
      description: attributes.description,
      fork: attributes.fork,
      homepage: attributes.homepage,
      name: attributes.name,
      owner: {
        id: attributes.owner.id,
        login: attributes.owner.login
      },
      permissions: attributes.permissions,
      private: attributes.private
    });
  }
});
