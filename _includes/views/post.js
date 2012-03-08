(function(config, models, views, routers, utils, templates) {

views.Post = Backbone.View.extend({
  id: 'post',

  initialize: function(options) {
    
  },

  render: function() {
    $(this.el).html(templates.post(this.model));
    return this;
  }
});

}).apply(this, window.args);