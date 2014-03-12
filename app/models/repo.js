var _ = require('underscore');
var Backbone = require('backbone');
var Branches = require('../collections/branches');
var Commits = require('../collections/commits');
var config = require('../config');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    Backbone.Model.call(this, {
      id: attributes.id,
      description: attributes.description,
      fork: attributes.fork,
      homepage: attributes.homepage,
      default_branch: attributes.default_branch,
      name: attributes.name,
      owner: {
        id: attributes.owner.id,
        login: attributes.owner.login
      },
      permissions: attributes.permissions,
      private: attributes.private,
      updated_at: attributes.updated_at
    });
  },

  initialize: function(attributes, options) {
    this.branches = new Branches([], { repo: this });
    this.commits = new Commits([], { repo: this, branch: this.branch })
  },

  ref: function(options) {
    options = _.clone(options) || {};

    $.ajax({
      type: 'POST',
      url: this.url() + '/git/refs',
      data: JSON.stringify({
        ref: options.ref,
        sha: options.sha
      }),
      success: options.success,
      error: options.error
    });
  },

  fork: function(options) {
    options = _.clone(options) || {};

    var success = options.success;

    $.ajax({
      type: 'POST',
      url: this.url() + '/forks',
      success: (function(res) {
        // Initialize new Repo model
        // TODO: is referencing module.exports in this manner acceptable?
        var repo = new module.exports(res);

        // TODO: Forking is async, retry if request fails
        repo.branches.fetch({
          success: (function(collection, res, options) {
            var prefix = 'prose-patch-';

            var branches = collection.filter(function(model) {
              return model.get('name').indexOf(prefix) === 0;
            }).map(function(model) {
              return parseInt(model.get('name').split(prefix)[1]);
            });

            var branch = prefix + (branches.length ? _.max(branches) + 1 : 1);

            if (_.isFunction(success)) success(repo, branch);
          }).bind(this),
          error: options.error
        })
      }).bind(this),
      error: options.error
    });
  },

  url: function() {
    return config.api + '/repos/' + this.get('owner').login + '/' + this.get('name');
  }
});
