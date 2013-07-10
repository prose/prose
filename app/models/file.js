var _ = require('underscore');
var marked = require('marked');
var Backbone = require('backbone');
var jsyaml = require('js-yaml');
var util = require('.././util');

module.exports = Backbone.Model.extend({
  idAttribute: 'sha',

  uploads: [],

  constructor: function(attributes, options) {
    Backbone.Model.call(this, {
      branch: attributes.branch,
      collection: attributes.collection,
      content: attributes.content,
      name: attributes.name,
      path: attributes.path,
      repo: attributes.repo,
      sha: attributes.sha,
      type: attributes.type,
      content_url: attributes.url
    });
  },

  initialize: function(attributes, options) {
    _.bindAll(this);

    var name = new Date().format('Y-m-d') + '-your-filename.md';
    var path = this.isNew() && _.isUndefined(attributes.path) ?
      attributes.path + '/' + name : attributes.path;
    var extension = util.extension(path);
    var permissions = attributes.repo ?
      attributes.repo.get('permissions') : undefined;
    var type;

    this.branch = attributes.branch;
    this.collection = attributes.collection;
    this.repo = attributes.repo;

    if (this.isNew() || attributes.type === 'blob') {
      type = 'file';
    } else {
      type = attributes.type;
    }

    // TODO: isNew() name and path defaults should fail this.validate()
    this.set({
      'binary': util.isBinary(extension),
      'content': this.isNew() && _.isUndefined(attributes.content) ? t('main.new.body') : attributes.content,
      'draft': function() {
        var path = this.get('path');
        return util.draft(path);
      },
      'extension': extension,
      'lang': util.mode(extension),
      'media': util.isMedia(extension),
      'markdown': util.isMarkdown(extension),
      'name': this.isNew() && _.isUndefined(attributes.path) ?
        name : util.extractFilename(attributes.path)[1],
      'path': path,
      'type': type,
      'writable': permissions ? permissions.push : false
    });
  },

  get: function(attr) {
    // Return result of functions set on model
    var value = Backbone.Model.prototype.get.call(this, attr);
    return _.isFunction(value) ? value.call(this) : value;
  },

  parse: function(resp, options) {
    if (typeof resp === 'string') {
      return this.parseContent(resp);
    } else if (typeof resp === 'object') {
      // TODO: whitelist resp JSON
      return _.omit(resp, 'content');
    }
  },

  parseContent: function(resp, options) {
    // Extract YAML from a post, trims whitespace
    resp = resp.replace(/\r\n/g, '\n'); // normalize a little bit

    var hasMetadata = !!util.hasMetadata(resp);

    if (!hasMetadata) return {
      content: resp,
      metadata: false,
      previous: resp
    };

    var res = {
      previous: resp
    };

    res.content = resp.replace(/^(---\n)((.|\n)*?)---\n?/, function(match, dashes, frontmatter) {
      try {
        // TODO: _.defaults for each key
        res.metadata = jsyaml.load(frontmatter);

        // Default to published unless explicitly set to false
        res.metadata.published = !frontmatter.match(/published: false/);
      } catch(err) {
        console.log('ERROR encoding YAML');
      }

      return '';
    }).trim();

    return res;
  },

  getContent: function(options) {
    options = options ? _.clone(options) : {};

    Backbone.Model.prototype.fetch.call(this, _.extend(options, {
      dataType: 'text',
      headers: {
        'Accept': 'application/vnd.github.raw'
      },
      url: this.get('content_url')
    }));
  },

  serialize: function() {
    var metadata = this.get('metadata');

    var content = this.get('content') || '';
    var frontmatter;

    if (metadata) {
      try {
        frontmatter = jsyaml.dump(metadata).trim();
      } catch(err) {
        throw err;
      }

      return ['---', frontmatter, '---'].join('\n') + '\n\n' + content;
    } else {
      return content;
    }
  },

  encode: function(content) {
    // Encode UTF-8 to Base64
    // https://developer.mozilla.org/en-US/docs/Web/API/window.btoa#Unicode_Strings
    return window.btoa(window.unescape(window.encodeURIComponent(content)));
  },

  decode: function(content) {
    // Decode Base64 to UTF-8
    // https://developer.mozilla.org/en-US/docs/Web/API/window.btoa#Unicode_Strings
    return window.decodeURIComponent(window.escape(window.atob(content)));
  },

  getAttributes: function() {
    var data = {};

    _.each(this.attributes, function(value, key) {
      data[key] = this.get(key);
    }, this);

    return data;
  },

  toJSON: function() {
    // override default toJSON method to only send necessary data to GitHub
    var path = this.get('path');
    var content = this.serialize();

    // TODO: check if commit message has been set
    var data = {
      path: path,
      message: (this.isNew() ?
        t('actions.commits.created', { filename: path }) :
        t('actions.commits.updated', { filename: path })),
      content: this.get('binary') ? window.btoa(content) : this.encode(content),
      branch: this.branch.get('name')
    };

    // Set sha if modifying existing file
    if (!this.isNew()) data.sha = this.get('sha');

    return data;
  },

  fetch: function(options) {
    // Series necessary for accurate isNew() check in getContent
    if (this.isNew()) {
      if (_.isFunction(options.success)) options.success();
      if (_.isFunction(options.complete)) options.complete();
    } else {
      // TODO: use deffered to fire callbacks when both functions complete
      Backbone.Model.prototype.fetch.call(this, _.omit(options, 'success', 'error', 'complete'));
      this.getContent.apply(this, arguments);
    }
  },

  save: function(options) {
    options = options ? _.clone(options) : {};

    // set method to PUT even when this.isNew()
    if (this.isNew()) {
      options = _.extend(options, {
        type: 'PUT'
      });
    }

    // call save method with undefined attributes
    Backbone.Model.prototype.save.call(this, undefined, options);
  },

  destroy: function(options) {
    options = _.clone(options) || {};

    var path = this.get('path');

    var data = {
      path: path,
      message: t('actions.commits.deleted', { filename: path }),
      sha: this.get('sha'),
      branch: this.branch.get('name')
    };

    var params = _.map(_.pairs(data), function(param) { return param.join('='); }).join('&');

    Backbone.Model.prototype.destroy.call(this, _.extend(options, {
      url: this.url() + '&' + window.escape(params),
      error: function(model, xhr, options) {
        // TODO: handle 422 Unprocessable Entity error
        console.log(model, xhr, options);
      }
    }));
  },

  url: function() {
    return this.repo.url() + '/contents/' + this.get('path') + '?ref=' + this.branch.get('name');
  },

  validate: function(attributes, options) {
    // Fail validation if path conflicts with another file in repo
    if (this.collection.where({ path: attributes.path }).length > 1) return t('actions.save.fileNameExists');

    // Validate the Markdown
    marked(attributes.content, {}, function(err, content) {
      if (err) return err;
    });
  }
});
