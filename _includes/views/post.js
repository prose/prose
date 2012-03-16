(function(config, models, views, routers, utils, templates) {

views.Post = Backbone.View.extend({

  id: 'post',

  events: {
    'click .publish': '_publish',
    'click .unpublish': '_unpublish',
    'click .meta': '_toggleMeta',
    'click a.toggle-mode': '_toggleMode',
    'change input': '_makeDirty'
  },

  _makeDirty: function(e) {
    this.$('.button.publish').removeClass('hidden');
  },

  _publish: function(e) {
    if (this.$('.message').hasClass('hidden')) {
      this.$('.message').removeClass('hidden'); 
    } else {
      this.updatePost(false, this.$('#commit_message').val());
    }
    return false;
  },

  _unpublish: function(e) {
    e.preventDefault();
    this.updatePost(true, "Unpublish "+ this.model.file);
  },

  _toggleMode: function(e) {
    e.preventDefault();
    var m = $(e.currentTarget)
    if (m.hasClass('preview')) {
      m
      .removeClass('preview')
      .addClass('edit')
      .html('edit');
      this.preview();
    } else {
      m
      .removeClass('edit')
      .addClass('preview')
      .html('preview');
      this.edit();
    }
  },

  _toggleMeta: function(e) {
    e.preventDefault();
    $('.metadata').toggleClass('open');
  },

  initialize: function() {
    this.mode = "edit";
    this.converter = new Showdown.converter();
  },

  updatePost: function(hidden, message) {
    var metadata = {
      title: this.$('#post_title').val(),
      subtitle: this.$('#post_subtitle').val(),
      layout: this.$('#post_layout').val(),
      category: this.$('#post_category').val(),
      permalink: this.$('#post_permalink').val(),
      image: this.$('#post_image').val(),
      hidden: hidden
    };

    savePost(app.state.user, app.state.repo, app.state.branch, this.model.path, this.model.file, metadata, this.editor.getValue(), message, _.bind(function(err) {
      this.model.metadata = metadata;
      this.updatePublishStatus();
      console.log('saaved');
    }, this));
  },


  updatePublishStatus: function() {
    this.$('#publish_status').html(templates.publish_status(this.model));
  },

  initEditor: function() {
    var that = this;
    setTimeout(function() {
      that.editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        mode: 'markdown',
        lineWrapping: true,
        matchBrackets: true,
        theme: "default",
        onChange: function() {
          that._makeDirty();
        }
      });
    }, 200);
  },

  edit: function() {
    // Hide preview & show code
    this.$('.content-preview').hide();
    this.$('.content').show();
  },

  preview: function() {
    // Show preview and hide code
    this.$('.content-preview').show();
    this.$('.post-content').html(this.converter.makeHtml(this.editor.getValue()));

    this.$('.content').hide();
  },

  render: function() {
    var that = this;
    $(this.el).html(templates.post(_.extend(this.model, { mode: this.mode })));

    this.updatePublishStatus();
    this.initEditor();
    return this;
  }
});

}).apply(this, window.args);
