(function(config, models, views, routers, utils, templates) {

views.Header = Backbone.View.extend({
  id: 'header',

  events: {
    "change #repository_name": "_switchRepository"
  },

  _switchRepository: function(e) {
    router.navigate($(e.currentTarget).val() + "/posts", true);
    return false;
  },

  initialize: function(options) {
    
  },

  render: function() {
    $(this.el).html(templates.header(_.extend(this.model, { repo: app.state.repo })));
    return this;
  }
});

}).apply(this, window.args);