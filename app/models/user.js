var Backbone = require('backbone');
var Repos = require('../collections/repos');
var Orgs = require('../collections/orgs');
var config = require('../config');
var cookie = require('../cookie');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    this.url = config.api + '/user';
    Backbone.Model.apply(this, arguments);
  },

  initialize: function(attributes, options) {
    if ('withCredentials' in new XMLHttpRequest() && this.authenticate()) {
      this.fetch({
        success: function(model, res, options) {
          var user = model.get('login');

          model.set('repos', new Repos([], {
            user: user
          }));

          model.set('orgs', new Orgs([], {
            user: user
          }));

          // Initialize router
          window.router = new app.router({ model: model });

          // Start responding to routes
          Backbone.history.start();
        },
        error: function() {
          // TODO: emit notification event
          var view = new window.app.views.Notification({
            'type': 'error',
            'message': 'Error while loading data from Github. This might be a temporary issue. Please try again later.'
          }).render();

          $('#prose').empty().append(view.el);
        }
      });
    } else {
      // TODO: emit notification event
      // Display an upgrade notice.
      var tmpl = _(window.app.templates.upgrade).template();

      _.defer(function() {
        $('#prose').empty().append(tmpl);
      });
    }
  },

  authenticate: function() {
    if (cookie.get('oauth-token')) return window.authenticated = true;

    var match = window.location.href.match(/\?code=([a-z0-9]*)/);

    // set oauth-token cookie
    if (match) {
      $.getJSON(auth.url + '/authenticate/' + match[1], function (data) {
        cookie.set('oauth-token', data.token);
        window.authenticated = true;

        // Adjust URL
        var regex = new RegExp("\\?code=" + match[1]);
        window.location.href = window.location.href.replace(regex, '').replace('&state=', '');
      });
      return false;
    } else {
      return true;
    }
  },

  logout: function() {
    window.authenticated = false;
    cookie.unset('oauth-token');
  },

  loadRepos: function() {
    model.set('repos', new Repos([], {
      user: user,
      success: function() {
        debugger;
      }
    }));
  }
});
