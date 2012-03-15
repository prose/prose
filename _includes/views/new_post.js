(function(config, models, views, routers, utils, templates) {

views.NewPost = Backbone.View.extend({
  id: 'new_post',

  events: {
    'submit #new_post_form': 'createPost'
  },

  createPost: function() {
    var that = this;
    var filename = this.$('.filename').val();
    var title =  this.$('.title').val();
    var subtitle = this.$('.subtitle').val();

    // TODO: make this smart
    // No assumptions on the repository layout should be made
    var metadata = {
      title: title,
      category: 'blog',
      subtitle: subtitle,
      hidden: true
    };

    savePost(this.model.repo, app.state.path + '/' + filename, metadata, '', function(err) {
      router.navigate(that.model.repo + '/' + app.state.path + '/' + filename, true);
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
