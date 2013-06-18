var _ = require('underscore');
var Backbone = require('backbone');
var jsyaml = require('js-yaml');
var config = require('../config');
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
      url: attributes.url
    });
  },

  initialize: function(attributes, options) {
    var extension =  util.extension(attributes.name);

    this.branch = attributes.branch;
    this.collection = attributes.collection;
    this.repo = attributes.repo;

    this.url = config.api + '/repos/' + this.repo.get('owner').login + '/' +
      this.repo.get('name') + '/contents/' + attributes.path;
    this.contentUrl = attributes.url;


    this.set('extension', extension);
    this.set('binary', util.isBinary(extension));
    this.set('lang', util.mode(extension));
    this.set('media', util.isMedia(extension));
    this.set('markdown', util.isMarkdown(extension));
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

    var writable = this.repo.get('permissions').push;
    var hasMetadata = !!util.hasMetadata(resp);

    if (!hasMetadata) return {
      content: resp,
      markdown: markdown, // TODO: determine if resp is markdown
      metadata: false,
      previous: resp,
      published: true,
      writable: writable
    };

    var res = {
      writable: writable
    };

    res.content = res.previous = resp.replace(/^(---\n)((.|\n)*?)---\n?/, function(match, dashes, frontmatter) {
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
      url: this.contentUrl
    }));
  },

  fetch: function(options) {
    // TODO: handle these two AJAX requests using deferreds, call 'success' callback after both complete
    Backbone.Model.prototype.fetch.call(this, _.omit(options, 'success'));
    this.getContent.apply(this, arguments);
  },

  getConfig: function() {
    return this.collection.findWhere({ name: '_prose.yml' }) ||
      this.collection.findWhere({ name: '_config.yml' });
  }
});
