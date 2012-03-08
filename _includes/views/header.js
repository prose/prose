(function(config, models, views, routers, utils, templates) {

views.Header = Backbone.View.extend({
  id: 'header',

  initialize: function(options) {
    
  },

  render: function() {
    $(this.el).html(templates.header(this.model));
    return this;
  }
});

}).apply(this, window.args);