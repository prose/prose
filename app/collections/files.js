var _ = require('underscore');

var Backbone = require('backbone');
var File = require('../models/file');
var Folder = require('../models/folder');

var cookie = require('../cookie');

module.exports = Backbone.Collection.extend({
  model: function(attributes, options) {
    // TODO: handle 'symlink' and 'submodule' type
    switch(attributes.type) {
      case 'blob':
        return new File(attributes, options);
        break;
      case 'tree':
        return new Folder(attributes, options);
        break;
      default:
        throw 'Unrecognized Type';
        break;
    }
  },

  initialize: function(models, options) {
    _.bindAll(this);

    this.repo = options.repo;
    this.branch = options.branch;
    this.sha = options.sha;

    this.comparator = 'name';
  },

  parse: function(resp, options) {
    return _.map(resp.tree, (function(file) {
      return  _.extend(file, {
        branch: this.branch,
        collection: this,
        repo: this.repo
      })
    }).bind(this));
  },

  url: function() {
    return this.repo.url() + '/git/trees/' + this.sha + '?recursive=1';
  },

  restore: function(file, options) {
    options = options ? _.clone(options) : {};

    var path = file.filename;
    var success = options.success;

    $.ajax({
      type: 'GET',
      url: file.contents_url,
      headers: {
        Authorization: 'token ' + cookie.get('oauth-token'),
        Accept: 'application/vnd.github.raw'
      },
      success: (function(res) {
        // initialize new File model with content
        var model = new File({
          branch: this.branch,
          collection: this,
          content: res,
          path: path,
          repo: this.repo
        });

        // add to collection on save
        model.save({
          success: (function(model, res, options) {
            // Update model attributes and add to collection
            model.set(res.content);
            this.add(model);

            if (_.isFunction(success)) success(model, res, options);
          }).bind(this),
          error: options.error
        });
      }).bind(this),
      error: options.error
    });
  }
});
