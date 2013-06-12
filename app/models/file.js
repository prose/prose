var Backbone = require('backbone');
var config = require('../config');
var utils = require('.././util');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    Backbone.Model.call(this, {
      name: attributes.name,
      path: attributes.path,
      sha: attributes.sha,
      type: attributes.type,
      url: attributes.url
    });
  },

  initialize: function(attributes, options) {
    this.url = attributes.url;

    var url = attributes.url.match(/repos\/(.*)\/(.*)\/contents\/(.*)ref?=(.*)/);

    var owner = { login: url[1] };
    this.set('owner', owner);

    this.set('repo', url[2]);
    this.set('branch', url[4]);

    var extension =  utils.extension(attributes.path);

    this.set('extension', extension);
    this.set('isBinary', utils.isBinary(extension));
    this.set('isMedia', utils.isMedia(extension));
  }
});
