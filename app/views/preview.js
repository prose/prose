var _ = require('underscore');
var Backbone = require('backbone');
var jsyaml = require('js-yaml');
var queue = require('queue-async');
var marked = require('marked');

module.exports = Backbone.View.extend({

  initialize: function(options) {
    _.bindAll(this);

    // TODO: instantiate a File view?
    this.repo = options.repo;
    this.branch = options.branch || this.repo.get('master_branch');
    this.branches = options.branches;
    this.path = options.path || '';

    this.branches.fetch({
      success: this.setCollection
    });
  },

  setCollection: function(collection, res, options) {
    this.collection = collection.findWhere({ name: this.branch }).files;
    this.collection.fetch({ success: this.setModel });
  },

  setModel: function(collection, res, options) {
    // Set model either by calling directly for new File models
    // or by filtering collection for existing File models
    this.model = options.model ? options.model : collection.findWhere({ path: this.path });

    this.model.fetch({
      complete: (function() {
        // TODO: save parsed config to the repo as it's used accross
        // files of the same repo and shouldn't be re-parsed each time
        this.config = collection.findWhere({ path: '_prose.yml' }) ||
          collection.findWhere({ path: '_config.yml' });

        // render view once config content has loaded
        this.config.fetch({
          complete: (function() {
            var content = this.config.get('content');

            try {
              this.config = jsyaml.load(content);
            } catch(err) {
              throw err;
            }

            this.poachConfig(this.config);

            this.render();
          }).bind(this)
        });
      }).bind(this)
    });
  },

  nearestPath: function(metadata) {
    // match nearest parent directory default metadata
    var path = this.model.get('path');
    var nearestDir = /\/(?!.*\/).*$/;

    while (metadata[path] === undefined && path.match( nearestDir )) {
      path = path.replace( nearestDir, '' );
    }

    return path;
  },

  poachConfig: function(config) {
    var q = queue();

    if (config && config.prose) {
      if (config.prose.metadata) {
        // Set empty defaults on model if no match
        // to avoid loading _config.yml again unecessarily
        var defaults = {};
        var metadata;
        var path;
        var raw;

        metadata = config.prose.metadata;
        path = this.nearestPath(metadata);

        if (metadata[path]) {
          raw = config.prose.metadata[path];

          if (_.isObject(raw)) {
            defaults = raw;

            // TODO: iterate over these to add to queue synchronously
            _.each(defaults, function(value, key) {

              // Parse JSON URL values
              if (value.field && value.field.options &&
                  _.isString(value.field.options) &&
                  value.field.options.match(/^https?:\/\//)) {

                q.defer(function(cb) {
                  $.ajax({
                    cache: true,
                    dataType: 'jsonp',
                    jsonp: false,
                    jsonpCallback: value.field.options.split('?callback=')[1] || 'callback',
                    url: value.field.options,
                    success: function(d) {
                      value.field.options = d;
                      cb();
                    }
                  });
                });
              }
            });
          } else if (_.isString(raw)) {
            try {
              defaults = jsyaml.load(raw);

              if (defaults.date === "CURRENT_DATETIME") {
                var current = (new Date()).format('Y-m-d H:i');
                defaults.date = current;
                raw = raw.replace("CURRENT_DATETIME", current);
              }
            } catch(err) {
              throw err;
            }
          }
        }
      }
    }
  },

  render: function() {
    // TODO: this.stashApply();
    this.preview();

    // Needs access to marked, so it's registered here.
    Liquid.Template.registerFilter({
      'markdownify': function(input) {
        return marked(input || '');
      }
    });

    return this;
  },

  stashApply: function() {
    if (!window.sessionStorage) return false;

    var storage = window.sessionStorage;
    var filepath = window.location.hash.split('/').slice(4).join('/');
    var stash = JSON.parse(storage.getItem(filepath));

    if (stash) {
      this.model.content = stash.content;
      this.model.metadata = stash.metadata;
    }
  },

  preview: function() {
    var q = queue(1);

    var metadata = this.model.get('metadata');

    var p = {
      site: this.config,
      post: metadata,
      page: metadata,
      content: Liquid.parse(marked(this.model.get('content'))).render({
        site: this.config,
        post: metadata,
        page: metadata
      }) || ''
    };

    function getLayout(cb) {
      var file = p.page.layout;
      var layout = this.collection.findWhere({ path: '_layouts/' + file + '.html' });

      layout.fetch({
        success: (function(model, res, options) {
          var meta = model.get('metadata');
          var content = model.get('content');
          var template = Liquid.parse(content);

          p.page = _.extend(metadata, meta);

          p.content = template.render({
            site: p.site,
            post: p.post,
            page: p.page,
            content: p.content
          });

          // Handle nested layouts
          if (meta && meta.layout) q.defer(getLayout.bind(this));

          cb();
        }).bind(this)
      })
    }

    q.defer(getLayout.bind(this));

    q.await((function() {
      var content = p.content;

      // Set base URL to public site
      if (this.config.prose && this.config.prose.siteurl) {
        content = content.replace(/(<head(?:.*)>)/, (function() {
          return arguments[1] + '<base href="' + this.config.prose.siteurl + '">';
        }).bind(this));
      }

      document.write(content);
      document.close();
    }).bind(this));
  }
});
