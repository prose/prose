(function(config, models, views, routers, utils, templates) {

views.Posts = Backbone.View.extend({

  initialize: function(options) {
    
  },

  render: function() {
    $(this.el).html(templates.posts(_.extend(this.model, {
      repo: app.state.repo
    })));
    return this;
  }
});

}).apply(this, window.args);