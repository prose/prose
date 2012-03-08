(function(config, models, views, routers, utils, templates) {

views.Posts = Backbone.View.extend({

  initialize: function(options) {
    
  },

  render: function() {
    $(this.el).html(templates.posts(this.model));
    return this;
  }
});

}).apply(this, window.args);