var Backbone = require('backbone');
var _ = require('underscore');
var jsyaml = require('js-yaml');

module.exports = Backbone.View.extend({
  render: function() {
    this.stashApply();
    _.preview(this);
    return this;
  },

  stashApply: function() {
    if (!window.localStorage) return false;

    var storage = window.localStorage,
        filepath = window.location.hash.split('/').slice(4).join('/');

    var stash = JSON.parse(storage.getItem(filepath));

    if (stash) {
      this.model.content = stash.content;
      this.model.raw_metadata = stash.raw_metadata;
      this.model.metadata = jsyaml.load(stash.raw_metadata);
    }
  }
});
