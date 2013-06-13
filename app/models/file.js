var _ = require('underscore');
var Backbone = require('backbone');
var config = require('../config');
var utils = require('.././util');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    Backbone.Model.call(this, {
      name: attributes.name,
      path: attributes.path,
      sha: attributes.sha,
      type: attributes.type,
      url: attributes.url
    });
  },

  initialize: function(attributes, options) {
    this.url = attributes.url;

    var url = attributes.url.match(/repos\/(.*)\/(.*)\/contents\/(.*)ref?=(.*)/);

    var owner = { login: url[1] };
    this.set('owner', owner);

    this.set('repo', url[2]);
    this.set('branch', url[4]);

    var extension =  utils.extension(attributes.path);

    this.set('extension', extension);
    this.set('isBinary', utils.isBinary(extension));
    this.set('isMedia', utils.isMedia(extension));
  },

  parse: function(resp, options) {
    // Extract YAML from a post, trims whitespace
    resp = resp.replace(/\r\n/g, '\n'); // normalize a little bit

    function writable() {
      return !!(app.state.permissions && app.state.permissions.push);
    }

    var hasMetadata = !!utils.hasMetadata(resp);

    debugger;

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
