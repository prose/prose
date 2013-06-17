var _ = require('underscore');
var Backbone = require('backbone');
var jsyaml = require('js-yaml');
var config = require('../config');
var util = require('.././util');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    var path = util.extractFilename(attributes.path);

    Backbone.Model.call(this, {
      name: path[1],
      path: path[0],
      repo: attributes.repo,
      sha: attributes.sha,
      type: attributes.type,
      url: attributes.url
    });
  },

  initialize: function(attributes, options) {
    this.url = attributes.url;
    this.repo = attributes.repo;

    var extension =  util.extension(attributes.name);

    this.set('extension', extension);
    this.set('binary', util.isBinary(extension));
    this.set('lang', util.mode(extension));
    this.set('media', util.isMedia(extension));
    this.set('markdown', util.isMarkdown(extension));
  },

  parse: function(resp, options) {
    // Extract YAML from a post, trims whitespace
    resp = resp.replace(/\r\n/g, '\n'); // normalize a little bit

    var writable = this.repo.get('permissions').push;
    var hasMetadata = !!util.hasMetadata(resp);

    if (!hasMetadata) return {
      content: resp,
      markdown: markdown, // TODO: determine if resp is markdown
      metadata: false,
      published: true,
      writable: writable
    };

    var res = {
      writable: writable
    };

    res.content = resp.replace(/^(---\n)((.|\n)*?)---\n?/, function(match, dashes, frontmatter) {
      try {
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
      }
    }));
  }
});
