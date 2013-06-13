var _ = require('underscore');
var Backbone = require('backbone');
var config = require('../config');
var util = require('.././util');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    var path = util.extractFilename(attributes.path);

    Backbone.Model.call(this, {
      name: path[1],
      path: path[0],
      sha: attributes.sha,
      type: attributes.type,
      url: attributes.url
    });
  },

  initialize: function(attributes, options) {
    this.url = attributes.url;

    var url = attributes.url.match(/repos\/(.*)\/(.*)\/git.*/);

    var owner = { login: url[1] };
    this.set('owner', owner);

    this.set('repo', url[2]);

    var extension =  util.extension(attributes.path);

    this.set('extension', extension);
    this.set('isBinary', util.isBinary(extension));
    this.set('isMedia', util.isMedia(extension));
  },

  parse: function(resp, options) {
    // Extract YAML from a post, trims whitespace
    resp = resp.replace(/\r\n/g, '\n'); // normalize a little bit

    function writable() {
      return !!(app.state.permissions && app.state.permissions.push);
    }

    var hasMetadata = !!util.hasMetadata(resp);

    if (!hasMetadata) return {
      content: resp,
      published: true,
      writable: writable(),
      jekyll: hasMetadata
    };

    var res = {
      writable: writable(),
      jekyll: hasMetadata
    };

    res.content = resp.replace(/^(---\n)((.|\n)*?)---\n?/, function(match, dashes, frontmatter) {
      try {
        res.metadata = jsyaml.load(frontmatter);
        res.metadata.published = published(frontmatter);
      } catch(err) {
        console.log('ERROR encoding YAML');
      }

      return '';
    }).trim();

    return res;
  },

  fetch: function(options) {
    options = options ? _.clone(options) : {};
    Backbone.Model.prototype.fetch.call(this, _.extend(options, {
      dataType: 'text'
    }));
  }
});
