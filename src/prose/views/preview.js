var _ = require('underscore');
var jsyaml = require('js-yaml');
var Backbone = require('backbone');

module.exports = Backbone.View.extend({
  render: function() {
    this.stashApply();
    _.preview(this);
    return this;
  },

  stashApply: function() {
    if (!window.localStorage) return false;

    var storage = window.localStorage;
    var stash = JSON.parse(storage.getItem('preview'));

    if (stash) {
      this.model.content = stash.content;
      this.model.metadata = stash.metadata;
    }
  }
});
