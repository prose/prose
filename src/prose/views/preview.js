var _ = require('underscore');
var jsyaml = require('js-yaml');
var Backbone = require('backbone');

module.exports = Backbone.View.extend({
  render: function() {
    this.eventRegister = app.eventRegister;

    var pathTitle = (app.state.path) ? app.state.path : '';
    this.eventRegister.trigger('documentTitle', 'Previewing ' + pathTitle + '/' + app.state.file + ' at ' + app.state.branch);
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
      this.model.metadata = stash.metadata;
    }
  }
});
