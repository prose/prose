(function(config, models, views, routers, utils, templates) {

views.Post = Backbone.View.extend({

  id: 'post',

  events: {
    'click .save': '_save',
    'click .meta': '_toggleMeta',
    'click a.toggle-mode.preview': '_togglePreview',
    'focus input': '_makeDirty',
    'focus textarea': '_makeDirty',
    'change #post_published': '_makeDirty'
  },

  _makeDirty: function(e) {
    this.dirty = true;
    this.$('.button.save').removeClass('inactive');
  },

  _save: function(e) {
    if (!this.dirty) return false;
    e.preventDefault();
    this.updatePost(this.model.metadata.published, 'Updated '+ this.model.file);
  },

  _togglePreview: function(e) {
    e.preventDefault();
    var m = $(e.currentTarget)
    if (m.hasClass('active')) {
      m
      .removeClass('active')
      .html('Preview');
      this.edit();
    } else {
      m
      .addClass('active')
      .html('Edit');
      this.preview();
    }
  },

  _toggleMeta: function(e) {
    e.preventDefault();
    this.updateMetaData();
    $('.metadata').toggleClass('open');
  },

  initialize: function() {
    this.mode = "edit";

    if (!window.shortcutsRegistered) {
      key('⌘+s, ctrl+s', _.bind(function() { this.updatePost(undefined, "Updated " + this.model.file); return false; }, this));
      window.shortcutsRegistered = true;
    }
    this.converter = new Showdown.converter();
  },

  updateMetaData: function(published) {
    this.model.metadata = jsyaml.load($('#raw_metadata').val());
    if (published !== undefined) this.model.metadata.published = published;
    this.model.metadata.title = this.$('#post_title').val();
    this.model.metadata.subtitle = this.$('#post_subtitle').val();
    this.model.metadata.published = this.$('#post_published').prop('checked');

    console.log(this.model.metadata.published);

    // Update metadata accordingly.
    var rawMetadata = _.toYAML(this.model.metadata);
    $('#raw_metadata').val(rawMetadata);
    return rawMetadata;
  },

  updatePost: function(published, message) {
    savePost(app.state.user, app.state.repo, app.state.branch, this.model.path, this.model.file, this.updateMetaData(published), this.editor.getValue(), message, _.bind(function(err) {
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
