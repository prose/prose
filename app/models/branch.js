var Backbone = require('backbone');
var Files = require('../collections/files');
var config = require('../config');

module.exports = Backbone.Model.extend({
  initialize: function(attributes, options) {
    this.repo = attributes.repo;

    var name = attributes.name;
    this.set('name', attributes.name);

    var sha = attributes.commit.sha;
    this.set('sha', sha);

    this.url = '/repos/' + this.repo.get('owner').login + '/' + this.repo.get('name') + '/branches/' + name;

    this.files = new Files([], {
      repo: this.repo,
      branch: this,
      sha: sha
    });
  }
});
