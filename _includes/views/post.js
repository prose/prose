(function(config, models, views, routers, utils, templates) {

views.Post = Backbone.View.extend({
  id: 'post',

  events: {
    "click .save-post": "save"
  },

  save: function() {
    var metadata = {
      title: this.$('#post_title').val(),
      subtitle: this.$('#post_subtitle').val(),
      layout: this.$('#post_layout').val(),
      category: this.$('#post_category').val(),
      permalink: this.$('#post_permalink').val(),
      image: this.$('#post_image').val(),
      hidden: !this.$('#post_published').val()
    }

    savePost(this.model.repo, this.model.path, metadata, this.editor.getValue(), function(err) {
      console.log('Saved');
    });
    return false;
  },

  initialize: function(options) {
    
  },

  initEditor: function() {
    var that = this;
    setTimeout(function() {
      that.editor = CodeMirror.fromTextArea(document.getElementById("code"), {
          mode: 'markdown',
          lineNumbers: true,
          matchBrackets: true,
          theme: "default"
      });
    }, 200);
  },

  render: function() {
    var that = this;
    $(this.el).html(templates.post(this.model));

    this.initEditor();

    return this;
  }
});

}).apply(this, window.args);