(function(config, models, views, routers, utils, templates) {

views.Profile = Backbone.View.extend({
  id: 'start',

  events: {
  },

  initialize: function(options) {},

  render: function() {
    $(this.el).html(templates.profile(this.model));
    return this;
  }
});

}).apply(this, window.args);
