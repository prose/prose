(function(config, models, views, routers, utils, templates) {

views.Post = Backbone.View.extend({

  id: 'post',

  events: {
      'click .save-post' : 'save',
      'click .state a': 'publish',
      'click .meta': 'toggleMeta'
  },

  publish: function(e) {
      e.preventDefault();
      // TODO replace save with publish and pass in commit message options
  },

  toggleMeta: function(e) {
      e.preventDefault();
      $('.metadata').toggleClass('open');
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
    };

    var message = this.$('#commit_message').val();
    savePost(app.state.username, app.state.repo, app.state.branch, this.model.path, this.model.file, metadata, this.editor.getValue(), message, function(err) {
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
          lineWrapping: true,
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
