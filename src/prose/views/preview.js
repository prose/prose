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

<<<<<<< HEAD
    var storage = window.localStorage;
    var stash = JSON.parse(storage.getItem('preview'));
=======
    var storage = window.localStorage,
        filepath = window.location.hash.split('/').slice(4).join('/');

    var stash = JSON.parse(storage.getItem(filepath));
>>>>>>> ade375e860ae2c41301f514e3fc9efae69eccb90

    if (stash) {
      this.model.content = stash.content;
      this.model.metadata = stash.metadata;
    }
  }
});
