(function(config, models, views, routers, utils, templates) {

views.Preview = Backbone.View.extend({
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

}).apply(this, window.args);
