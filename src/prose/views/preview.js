var _ = require('underscore');
var jsyaml = require('js-yaml');
var Backbone = require('backbone');
var marked = require('marked');

module.exports = Backbone.View.extend({
  render: function() {
    this.eventRegister = app.eventRegister;

    var pathTitle = (app.state.path) ? app.state.path : '';
    this.eventRegister.trigger('documentTitle', t('docheader.preview') + pathTitle + '/' + app.state.file + ' at ' + app.state.branch);
    this.stashApply();

    // Needs access to marked, so it's registered here.
    Liquid.Template.registerFilter({
      'markdownify': function(input) {
        return marked(input || '');
      }
    });

    _.preview(this);
    return this;
  },

  stashApply: function() {
    if (!window.sessionStorage) return false;

    var storage = window.sessionStorage;
    var filepath = window.location.hash.split('/').slice(4).join('/');
    var stash = JSON.parse(storage.getItem(filepath));

    if (stash) {
      this.model.content = stash.content;
      this.model.metadata = stash.metadata;
    }
  }
});
