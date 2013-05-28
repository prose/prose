var $ = require('jquery-browserify');
var _ = require('underscore');
var cookie = require('../cookie');

var Backbone = require('backbone');
Backbone.sync = require('../backbone-github');

var Repos = require('../collections/repos');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    this.name = 'user';
    Backbone.Model.apply(this, arguments);
  },

  initialize: function(attributes, options) {
    this.fetch({
      success: function(model, response, options) {
        model.set('repos', new Repos([], {
          user: model.get('login')
        }));

        cookie.set('avatar', model.get('avatar_url'));
        cookie.set('username', model.get('login'));

        // Initialize router
        window.router = new app.router({
          model: model
        });

        // Start responding to routes
        Backbone.history.start();
      },
      error: function() {
        var view = new window.app.views.Notification({
          'type': 'eror',
          'message': 'Error while loading data from Github. This might be a temporary issue. Please try again later.'
        }).render();

        $('#prose').empty().append(view.el);
      }
    });

    console.log(this);
  }
});
