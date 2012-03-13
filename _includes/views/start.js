(function(config, models, views, routers, utils, templates) {

views.Start = Backbone.View.extend({
  id: 'start',


  initialize: function(options) {
    
  },

  render: function() {
    $(this.el).html(templates.start(this.model));
    return this;
  }
});

}).apply(this, window.args);