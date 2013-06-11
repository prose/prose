var Backbone = require('backbone');
var User = require('../models/user');
var config = require('../config');

module.exports = Backbone.Collection.extend({
  model: User
});
