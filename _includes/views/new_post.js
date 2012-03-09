(function(config, models, views, routers, utils, templates) {

views.NewPost = Backbone.View.extend({
  id: 'new_post',

  events: {
    'submit #new_post_form': 'createPost'
  },

  createPost: function() {
    var that = this;
    var filename = this.$('.filename').val();
    savePost(this.model.repo, "path/to/"+filename, "AN ALL NEW BLOGPOST", function(err) {
      router.navigate(that.model.repo + "/" + "path/to/"+filename, true);
    });
    return false;
  },

  initialize: function(options) {
    
  },

  render: function() {
    $(this.el).html(templates.new_post(this.model));
    return this;
  }
});

}).apply(this, window.args);