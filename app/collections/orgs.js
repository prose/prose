var Backbone = require('backbone');
var Org = require('../models/org');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: Org,

  load: function(options) {
    this.user = options.model;
    this.url = config.api + '/users/' + options.user + '/orgs';
    this.fetch({ reset: true });
  }
});
