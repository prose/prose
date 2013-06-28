var Backbone = require('backbone');
var Repo = require('../models/repo');

var auth = require('../config');
var cookie = require('../cookie');

module.exports = Backbone.Collection.extend({
  model: Repo,

  initialize: function(models, options) {
    this.user = options.user;

    this.comparator = function(repo) {
      return -(new Date(repo.get('updated_at')).getTime());
    };
  },

  url: function() {
    var id = cookie.get('id');
    return auth.api + (id && this.get('id') === id ? '/user/repos' : '/users/' + this.user.get('login') + '/repos');
  }
});
