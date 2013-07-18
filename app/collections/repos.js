var _ = require('underscore');

var Backbone = require('backbone');
var Repo = require('../models/repo');

var auth = require('../config');
var cookie = require('../cookie');

module.exports = Backbone.Collection.extend({
  model: Repo,

  initialize: function(models, options) {
    _.bindAll(this);

    this.user = options.user;

    this.comparator = function(repo) {
      return -(new Date(repo.get('updated_at')).getTime());
    };
  },

  parseLinkHeader: function(xhr, options) {
    options = _.clone(options) || {};

    var header = xhr.getResponseHeader('link');

    if (header) {
      var parts = header.split(',');
      var links = {};

      _.each(parts, function(link) {
        var section = link.split(';');

        var url = section[0].replace(/<(.*)>/, '$1').trim();
        var name = section[1].replace(/rel="(.*)"/, '$1').trim();

        links[name] = url;
      });

      if (links.next) {
        $.ajax({
          type: 'GET',
          url: links.next,
          success: options.success,
          error: options.error
        });
      } else {
        if (_.isFunction(options.complete)) options.complete();
      }
    } else {
      if (_.isFunction(options.error)) options.error();
    }
  },

  fetch: function(options) {
    options = _.clone(options) || {};

    var cb = options.success;

    var success = (function(res, statusText, xhr) {
      this.add(res);
      this.parseLinkHeader(xhr, {
        success: success,
        complete: cb
      });
    }).bind(this);

    Backbone.Collection.prototype.fetch.call(this, _.extend(options, {
      success: (function(model, res, options) {
        this.parseLinkHeader(options.xhr, {
          success: success,
          error: cb
        });
      }).bind(this)
    }));
  },

  url: function() {
    var id = cookie.get('id');
    var type = this.user.get('type');
    var path;

    switch(type) {
      case 'User':
        path = (id && this.user.get('id') === id) ? '/user' :
          ('/users/' + this.user.get('login'))
        break;
      case 'Organization':
        path = '/orgs/' + this.user.get('login');
        break;
    }

    return auth.api + path + '/repos?per_page=100';
  }
});
