var Backbone = require('backbone');
var State = require('./state');
var Repos = require('../collections/repos');
var Orgs = require('../collections/orgs');
var config = require('../config');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    this.url = config.api + '/user';
    this.repos = new Repos([], { user: this });
    this.orgs = new Orgs([], { user: this });
    Backbone.Model.apply(this, arguments);
  },

  initialize: function(attributes, options) {
    if ('withCredentials' in new XMLHttpRequest() && State.authenticate()) {
      this.fetch({
        success: function(model, res, options) {
          // Initialize router
          window.router = new app.router({ user: model });

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
      var tmpl = _.template(window.app.templates.upgrade);

      _.defer(function() {
        $('#prose').empty().append(tmpl);
      });
    }
  }
});
