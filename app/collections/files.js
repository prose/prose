var _ = require('underscore');
var jsyaml = require('js-yaml');
var queue = require('queue-async');

var Backbone = require('backbone');
var File = require('../models/file');
var Folder = require('../models/folder');

var cookie = require('../cookie');
var util = require('../util');
var ignore = require('ignore');

module.exports = Backbone.Collection.extend({
  model: function(attributes, options) {
    // TODO: handle 'symlink' and 'submodule' type
    // TODO: coerce tree/folder to a single type
    switch(attributes.type) {
      case 'tree':
        return new Folder(attributes, options);
        break;
      case 'blob':
        return new File(attributes, options);
        break;
      default:
        return new File(attributes, options);
        break;
    }
  },

  initialize: function(models, options) {
    _.bindAll(this);

    this.repo = options.repo;
    this.branch = options.branch;
    this.sha = options.sha;

    // Sort files reverse alphabetically if path begins with '_posts/'
    this.comparator = function(a, b) {
      var typeA = a.get('type');
      var typeB = b.get('type');

      var pathA = a.get('path');
      var pathB = b.get('path');

      var regex = /^_posts\/.*$/

      if (typeA === typeB && typeA === 'file' && regex.test(pathA) && regex.test(pathB)) {
        // Reverse alphabetical
        return pathA < pathB ? 1 : -1;
      } else if (typeA === typeB) {
        // Alphabetical
        return pathA < pathB ? -1 : 1;
      } else {
        switch(typeA) {
          case 'tree':
          case 'folder':
            return -1;
            break;
          case 'file':
            return typeB === 'folder' || typeB === 'tree' ? 1 : -1;
            break;
        }
      }
    };
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

  parseConfig: function(config, options) {
    var content = config.get('content');

    // Attempt to parse YAML
    try {
      config = jsyaml.safeLoad(content);
    } catch(err) {
      console.log("Error parsing YAML");
      console.log(err);
    }

    if (config && config.prose) {
      // Load _config.yml, set parsed value on collection
      // Extend to capture settings from outside config.prose
      // while allowing override
      this.config = _.extend({
        baseurl: config.baseurl,
        languages: config.languages
      }, config.prose);

      if (config.prose.ignore) {
        this.parseIgnore(config.prose.ignore);
      }

      if (config.prose.metadata) {
        var metadata = config.prose.metadata;

        // Serial queue to not break global scope JSONP callbacks
        var q = queue(1);

        _.each(metadata, function(raw, key) {
          q.defer(function(cb) {
            var subq = queue();
            var defaults;

            if (_.isObject(raw)) {
              defaults = raw;

              _.each(defaults, function(value, key) {
                var regex = /^https?:\/\//;

                // Parse JSON URL values
                if (value && value.field && value.field.options &&
                    _.isString(value.field.options) &&
                    regex.test(value.field.options)) {

                  subq.defer(function(cb) {
                    $.ajax({
                      cache: true,
                      dataType: 'jsonp',
                      jsonp: false,
                      jsonpCallback: value.field.options.split('?callback=')[1] || 'callback',
                      timeout: 5000,
                      url: value.field.options,
                      success: (function(d) {
                        value.field.options = _.compact(d);
                        cb();
                      }).bind(this)
                    });
                  });
                }
              });
            } else if (_.isString(raw)) {
              try {
                defaults = jsyaml.safeLoad(raw);

                if (defaults.date === "CURRENT_DATETIME") {
                  var current = (new Date()).format('Y-m-d H:i');
                  defaults.date = current;
                  raw = raw.replace("CURRENT_DATETIME", current);
                }
              } catch(err) {
                console.log("Error parsing default values.");
                console.log(err);
              }
            }

            subq.awaitAll(function() {
              metadata[key] = defaults;
              cb();
            });
          });
        });

        q.awaitAll((function() {
          // Save parsed config to the collection as it's used accross
          // files of the same collection and shouldn't be re-parsed each time
          this.defaults = metadata;

          if (_.isFunction(options.success)) options.success.apply(this, options.args);
        }).bind(this));
      } else {
        if (_.isFunction(options.success)) options.success.apply(this, options.args);
      }
    } else {
      if (_.isFunction(options.success)) options.success.apply(this, options.args);
    }
  },

  parseIgnore: function(ignorePatterns) {
    var ignoreFilter = ignore().addPattern(ignorePatterns).createFilter();
    this.filteredModel = new Backbone.Collection(this.filter(function(file) {
      return ignoreFilter(file.id);
    }));
  },

  fetch: function(options) {
    options = _.clone(options) || {};

    var success = options.success;
    var args = options.args;

    Backbone.Collection.prototype.fetch.call(this, _.extend(options, {
      success: (function(model, res, options) {
        var config = this.findWhere({ path: '_prose.yml' }) ||
          this.findWhere({ path: '_config.yml' });

        if (config) {
          config.fetch({
            success: (function() {
              this.parseConfig(config, { success: success, args: args });
            }).bind(this)
          });
        } else {
          if (_.isFunction(success)) success.apply(this, args);
        }

      }).bind(this)
    }));
  },

  restore: function(file, options) {
    options = options ? _.clone(options) : {};

    var path = file.filename;
    var success = options.success;

    $.ajax({
      type: 'GET',
      url: file.contents_url,
      headers: {
        Accept: 'application/vnd.github.v3.raw'
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

        var name = util.extractFilename(path)[1];
        model.set('placeholder', t('actions.commits.created', { filename: name }));

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
  },

  upload: function(file, content, path, options) {
    var success = options.success;

    var extension = file.type.split('/').pop();
    var uid;

    if (!path) {
      uid = file.name;

      if (this.assetsDirectory) {
        path = this.assetsDirectory + '/' + uid;
      } else {
        path = this.model.path ? this.model.path + '/' + uid : uid;
      }
    }

    // If path matches an existing file, confirm the overwrite is intentional
    // then set new content and update the existing file
    var model = this.findWhere({ path: path });

    if (model) {
      // TODO: confirm overwrite with UI prompt
      model.set('content', content);
      model.set('placeholder', t('actions.commits.updated', { filename: file.name }));
    } else {
      // initialize new File model with content
      model = new File({
        branch: this.branch,
        collection: this,
        content: content,
        path: path,
        repo: this.repo
      });

      model.set('placeholder', t('actions.commits.created', { filename: file.name }));
    }

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
  },

  url: function() {
    return this.repo.url() + '/git/trees/' + this.sha + '?recursive=1';
  }
});
