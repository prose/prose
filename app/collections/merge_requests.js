var _ = require('underscore');
var Backbone = require('backbone');
var MergeRequest = require('../models/merge_request');

module.exports = Backbone.Collection.extend({
  model: MergeRequest,

  initialize: function(merge_requests, options) {
    console.log('initializing merge requests')
    this.repo = options.repo;
  },

  url: function() {
      return this.repo.url() + '/merge_requests';
  }
});
