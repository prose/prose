var _ = require('underscore');
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
      name: util.extractFilename(attributes.path)[1],
      path: attributes.path,
      repo: attributes.repo,
      sha: attributes.sha,
      type: attributes.type,
      content_url: attributes.url
    });
  },

  initialize: function(attributes, options) {
    _.bindAll(this);

    var extension =  util.extension(attributes.name);

    this.branch = attributes.branch;
    this.collection = attributes.collection;
    this.repo = attributes.repo;

    this.set('extension', extension);
    this.set('binary', util.isBinary(extension));
    this.set('lang', util.mode(extension));
    this.set('media', util.isMedia(extension));
    this.set('markdown', util.isMarkdown(extension));
    this.set('writable', this.repo.get('permissions').push);
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
    var metadata;
    var content = this.get('content');

    try {
      metadata = jsyaml.dump(this.get('metadata')).trim();
    } catch(err) {
      throw err;
    }

    if (metadata) {
      return ['---', metadata, '---'].join('\n') + '\n\n' + content;
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
    return window.decodeURIComponent(window.escape(window.atob(content)));
  },

  fetch: function(options) {
    // TODO: handle these two AJAX requests using deferreds, call 'success' callback after both complete
    Backbone.Model.prototype.fetch.call(this, _.omit(options, 'success', 'error', 'complete'));
    this.getContent.apply(this, arguments);
  },

  save: function(options) {
    options = _.clone(options) || {};

    var path = this.get('path');

    var data = {
      path: path,
      message: (this.isNew() ?
        t('actions.commits.created', { filename: path }) :
        t('actions.commits.updated', { filename: path })),
      content: this.encode(this.serialize()),
      sha: this.get('sha'),
      branch: this.branch.get('name')
    };

    debugger;

    var params = _.map(_.pairs(data), function(param) { return param.join('='); }).join('&');

    Backbone.Model.prototype.save.call(this, _.extend(options, {
      url: this.url() + '&' + params
    }));
  },

  destroy: function(options) {
    options = _.clone(options) || {};

    var path = this.get('path');

    var data = {
      path: path,
      message: 'Deleted ' + path,
      sha: this.get('sha'),
      branch: this.branch.get('name')
    };

    var params = _.map(_.pairs(data), function(param) { return param.join('='); }).join('&');

    Backbone.Model.prototype.destroy.call(this, _.extend(options, {
      url: this.url() + '&' + params
    }));
  },

  url: function() {
    return this.repo.url() + '/contents/' + this.get('path') + '?ref=' + this.branch.get('name');
  }
});
