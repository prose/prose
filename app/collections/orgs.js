var Backbone = require('backbone');
var Org = require('../models/org');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: Org,

  constructor: function(models, options) {
    this.url = config.api + '/users/' + options.user + '/orgs';
    Backbone.Collection.apply(this, arguments);
  },

  initialize: function(models, options) {
    this.fetch({ reset: true });
  }
});
