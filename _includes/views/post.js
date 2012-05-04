(function(config, models, views, routers, utils, templates) {

views.Post = Backbone.View.extend({

  id: 'post',

  events: {
    'click .publish': '_publish',
    'click .save': '_save',
    'click .unpublish': '_unpublish',
    'click .meta': '_toggleMeta',
    'click a.toggle-mode': '_toggleMode',
    'change input': '_makeDirty'
  },

  _makeDirty: function(e) {
    this.dirty = true;
    this.$('.button.save').removeClass('inactive');
  },

  _save: function(e) {
    if (!this.dirty) return;
    e.preventDefault();
    this.updatePost(this.model.metadata.published, 'Unpublish '+ this.model.file);
  },

  _publish: function(e) {
    e.preventDefault();
    this.updatePost(true, this.$('#commit_message').val());
  },

  _unpublish: function(e) {
    e.preventDefault();
    this.updatePost(false, 'Unpublish '+ this.model.file);
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

  updatePost: function(published, message) {
    var metadata = jsyaml.load($('#raw_metadata').val());
    metadata.published = published;
    metadata.title = this.$('#post_title').val();
    metadata.subtitle = this.$('#post_subtitle').val();

    // Update metadata accordingly.
    var rawMetadata = _.toYAML(metadata);
    $('#raw_metadata').val(rawMetadata);

    savePost(app.state.user, app.state.repo, app.state.branch, this.model.path, this.model.file, rawMetadata, this.editor.getValue(), message, _.bind(function(err) {
      this.model.metadata = metadata;
      this.dirty = false;
      this.updatePublishStatus();
    }, this));
  },

  updatePublishStatus: function() {
    this.$('#publish_status').html(templates.publish_status(this.model));
  },

  initEditor: function() {
    var that = this;
    setTimeout(function() {
      that.editor = CodeMirror.fromTextArea(document.getElementById('code'), {
        mode: 'markdown',
        lineWrapping: true,
        matchBrackets: true,
        theme: 'default',
        onChange: _.bind(that._makeDirty, that)
      });
    }, 100);
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
