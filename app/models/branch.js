var Backbone = require('backbone');
var Files = require('../collections/files');
var config = require('../config');

module.exports = Backbone.Model.extend({
  initialize: function(attributes, options) {
    var url = this.get('commit').url.match(/repos\/(.*)\/(.*)\/commits/);

    var owner = { login: url[1] };
    this.set('owner', owner);

    var repo = url[2];
    this.set('repo', repo);

    var name = attributes.name;

    this.url = '/repos/' + owner.login + '/' + repo + '/branches/' + name;
    this.files = new Files([], { owner: owner, repo: repo, branch: name });
  }
});
