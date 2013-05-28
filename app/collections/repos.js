var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var cookie = require('../cookie');

module.exports = Backbone.Collection.extend({
  initialize: function(cb) {
    var _this = this;

    $.ajax({
      type: 'GET',
      url: auth.api + '/user/repos',
      contentType: 'application/x-www-form-urlencoded',
      headers: {
        'Authorization': 'token ' + cookie.get('oauth-token')
      },
      success: function(res, textStatus, xhr) {
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
  }
});
