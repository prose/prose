var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var Repos = require('../collections/repos');
var cookie = require('../cookie');

module.exports = Backbone.Model.extend({
  initialize: function(cb) {
    var _this = this;

    if (window.authenticated) {
      $.ajax({
        type: 'GET',
        url: auth.api + '/user',
        contentType: 'application/x-www-form-urlencoded',
        headers: {
          'Authorization': 'token ' + cookie.get('oauth-token')
        },
        success: function(res, textStatus, xhr) {
          _this.set({
            avatar_url: res.avatar_url,
            login: res.login,
            name: res.name,
            organizations_url: res.organizations_url,
            repos_url: res.repos_url
          });

          cookie.set('avatar', _this.avatar_url);
          cookie.set('username', _this.login);

          var repos = new Repos();
          _this.set('repos', repos);

          console.log(res, _this);

          /*
          var user = github().getUser();
          var owners = {};

          user.repos(function(err, repos) {
            user.orgs(function(err, orgs) {
              _.each(repos, function(r) {
                owners[r.owner.login] = owners[r.owner.login] ? owners[r.owner.login].concat([r]) : [r];
              });

              cb(null, {
                'available_repos': repos,
                'organizations': orgs,
                'owners': owners
              });
            });
          });
          */
        },
        error: function(err) {
          cb('error', {
            'available_repos': [],
            'owners': {}
          });
        }
      });
    } else {
      cb(null, {
        'available_repos': [],
        'owners': {}
      });
    }
  }
});
