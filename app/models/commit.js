var _ = require('underscore');
var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  initialize: function(attributes, options) {
    _.bindAll(this);

    this.repo = attributes.repo;
  },

  url: function() {
    return this.repo.url() + '/commits/' + this.get('sha');
  }
});
