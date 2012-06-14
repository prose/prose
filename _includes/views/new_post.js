(function(config, models, views, routers, utils, templates) {

views.NewPost = Backbone.View.extend({
  id: 'new_post',

  events: {
    'submit #new_post_form': 'createPost'
  },

  initialize: function(options) {

  },

  render: function() {
    $(this.el).html(templates.new_post(this.model));
    return this;
  }
});

}).apply(this, window.args);
