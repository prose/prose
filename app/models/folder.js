var _ = require('underscore');
var Backbone = require('backbone');
var util = require('.././util');

module.exports = Backbone.Model.extend({
  idAttribute: 'path',

  initialize: function(attributes, options) {
    _.bindAll(this);

    this.branch = attributes.branch;
    this.collection = attributes.collection;
    this.repo = attributes.repo;

    this.set({
      'name': util.extractFilename(attributes.path)[1],
      'path': attributes.path,
      'type': attributes.type
    });
  },

  url: function() {
    return this.repo.url() + '/contents/' + this.get('path') + '?ref=' + this.branch.get('name');
  }
});
