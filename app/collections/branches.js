var _ = require('lodash');
var Backbone = require('backbone');
var Branch = require('../models/branch');
var util = require('../util');

module.exports = Backbone.Collection.extend({
  model: Branch,

  initialize: function(models, options) {
    this.repo = options.repo;
  },

  parse: function(resp, options) {
    return _.map(resp, (function(branch) {
     return  _.extend(branch, {
        repo: this.repo
      })
    }).bind(this));
  },

  fetch: function(options) {
    options = _.clone(options) || {};

    var cb = options.success;

    var success = (function(res, statusText, xhr) {
      this.add(res);
      util.parseLinkHeader(xhr, {
        success: success,
        complete: cb
      });
    }).bind(this);

    Backbone.Collection.prototype.fetch.call(this, _.extend(options, {
      success: (function(model, res, options) {
        util.parseLinkHeader(options.xhr, {
          success: success,
          error: cb
        });
      }).bind(this)
    }));
  },

  url: function() {
    return this.repo.url() + '/branches?per_page=100';
  }
});
