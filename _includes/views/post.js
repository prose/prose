(function(config, models, views, routers, utils, templates) {

views.Post = Backbone.View.extend({

  id: 'post',

  events: {
    'click .save': '_save',
    'click .toggle.meta': '_toggleMeta',
    'click a.toggle.preview': '_togglePreview',
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
    this.$('.post-content').html(this.converter.makeHtml(this.editor.getValue()));
    $('.document .surface').toggleClass('preview');
  },

  _toggleMeta: function(e) {
    e.preventDefault();
    this.updateMetaData();
    $('.metadata').toggle();
    return false;
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
    this.model.metadata.published = this.$('#post_published').prop('checked');

    // Update metadata accordingly.
    var rawMetadata = _.toYAML(this.model.metadata);
    $('#raw_metadata').val(rawMetadata);
    return rawMetadata;
  },

  updatePost: function(published, message) {
    savePost(app.state.user, app.state.repo, app.state.branch, this.model.path, this.model.file, this.updateMetaData(published), this.editor.getValue(), message, _.bind(function(err) {
      this.dirty = false;
      $('.button.save').addClass('inactive');
    }, this));
  },

  initEditor: function() {
    var that = this;
    setTimeout(function() {

      that.metadataEditor = CodeMirror.fromTextArea(document.getElementById('raw_metadata'), {
        // mode: 'markdown',
        lineWrapping: true,
        matchBrackets: true,
        theme: 'default',
        onChange: _.bind(that._makeDirty, that)
      });

      $('#post .metadata').hide();

      that.editor = CodeMirror.fromTextArea(document.getElementById('code'), {
        // mode: 'markdown',
        lineWrapping: true,
        matchBrackets: true,
        theme: 'default',
        onChange: _.bind(that._makeDirty, that)
      });
    }, 100);
  },

  // UpdateHeight
  updateHeight: function() {
    $('.personalities-wrapper').height(this.$('.content .CodeMirror').height());
  },

  render: function() {
    var that = this;
    $(this.el).html(templates.post(_.extend(this.model, { mode: this.mode })));
    this.initEditor();
    return this;
  }
});

}).apply(this, window.args);
