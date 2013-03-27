(function(config, models, views, routers, utils, templates) {

views.Preview = Backbone.View.extend({
  render: function() {
    _.preview(this);
    return this;
  }
});

}).apply(this, window.args);
