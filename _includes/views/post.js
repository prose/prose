(function(config, models, views, routers, utils, templates) {

views.Post = Backbone.View.extend({

  id: 'post',

  events: {
    'click .save': '_save',
    'click .toggle.meta': '_toggleMeta',
    'click a.toggle.preview': '_togglePreview',
    'focus input': '_makeDirty',
    'focus textarea': '_makeDirty',
    'change #post_published': 'updateMetaData',
    'change input.filename': '_updateFilename',
    'click .delete': '_delete',
    'click .toggle-options': '_toggleOptions'
  },

  _toggleOptions: function() {
    $('.options').toggle();
    return false;
  },

  _delete: function() {
    if (confirm("Are you sure you want to delete that document?")) {
      deletePost(app.state.user, app.state.repo, app.state.branch, this.model.path, this.model.file, _.bind(function(err) {
        router.navigate([app.state.user, app.state.repo, app.state.branch, this.model.path].join('/'), true);
      }, this));      
    }
    return false;
  },

  updateURL: function() {
    router.navigate([app.state.user, app.state.repo, app.state.branch, this.model.path, this.model.file].join('/'), false);
  },

  _updateFilename: function(e) {
    var file = $(e.currentTarget).val();
    var that = this;
    
    // Indicate error etc.
    function updateState(state) {
      that.$('.filename .state').removeClass('success error loading');
      that.$('.filename .state').addClass(state);

      _.delay(function() {
        that.$('.filename .state').removeClass('success error loading');
      }, 3000);
    }

    if (this.model.persisted) {
      if (!_.validFilename(file)) return updateState('error');
      console.log('should not be reached');
      updateState('loading');
      movePost(app.state.user, app.state.repo, app.state.branch, this.model.path + "/" + this.model.file, this.model.path + "/" + file, _.bind(function(err) {
        updateState(err ? 'error' : 'success');
        if (!err) this.updateURL();
      }, this));
    }
    this.model.file = $(e.currentTarget).val();
  },

  _makeDirty: function(e) {
    this.dirty = true;
    this.$('.button.save').html('SAVE');
    this.$('.button.save').removeClass('inactive');
    // this.updateMetaData();
  },
  
  _save: function(e) {
    if (!this.dirty) return false;
    e.preventDefault();
    this.updatePost(this.model.metadata.published, 'Updated '+ this.model.file);
  },

  _togglePreview: function(e) {
    if (e) e.preventDefault();
    $('.toggle.preview').toggleClass('active');
    this.$('.post-content').html(this.converter.makeHtml(this.editor.getValue()));
    $('.document .surface').toggleClass('preview');
  },

  _toggleMeta: function(e) {
    if (e) e.preventDefault();
    $('.toggle.meta').toggleClass('active');
    // this.updateMetaData();

    $('.metadata').toggle();
    return false;
  },

  initialize: function() {
    this.mode = "edit";
    if (!window.shortcutsRegistered) {
      key('⌘+s, ctrl+s', _.bind(function() { this.updatePost(undefined, "Updated " + this.model.file); return false; }, this));
      key('ctrl+shift+p', _.bind(function() { this._togglePreview(); return false; }, this));
      key('ctrl+shift+m', _.bind(function() { this._toggleMeta(); return false; }, this));
      window.shortcutsRegistered = true;
    }
    this.converter = new Showdown.converter();
  },

  // TODO: remove comments and simplify after we are sure that we don't want to parse metadata
  updateMetaData: function() {

    // Update published
    function updatePublished(yamlStr, published) {
      var regex = /published: (false|true)/;
      if (yamlStr.match(regex)) {
        return yamlStr.replace(regex, "published: " + !!published);
      } else {
        return yamlStr + "\npublished: " + !!published;
      }
    }
    this.rawMetadata = this.metadataEditor.getValue();
    published = this.$('#post_published').prop('checked');

    this.rawMetadata = updatePublished(this.rawMetadata, published);
    try {
      this.model.metadata = jsyaml.load(this.rawMetadata);
      this.metadataEditor.setValue(this.rawMetadata);
      if (this.model.metadata.published) {
        $('#post').addClass('published');
      } else {
        $('#post').removeClass('published');
      }
      return true;
    } catch(err) {
      return false;
    }
  },

  updatePost: function(published, message) {
    if (this.updateMetaData(published)) {
      this.$('.button.save').addClass('inactive');
      this.$('.button.save').html('SAVING ...');
      this.$('.document-menu-content .options').hide();

      savePost(app.state.user, app.state.repo, app.state.branch, this.model.path, this.model.file, this.rawMetadata, this.editor.getValue(), message, _.bind(function(err) {
        this.dirty = false;
        this.model.persisted = true;
        this.updateURL();
        $('.button.save').html('SAVED');
        $('.button.save').addClass('inactive');
      }, this));
    } else {
      // TODO: do pretty messaging
      alert('Invalid Metadata. Cannot save.');
    }

  },

  keyMap: function() {
    var that = this;
    return {
      // This doesn't work. Why?
      "Shift-Ctrl-P": function(codemirror) {
        that._togglePreview();
      },
      "Shift-Ctrl-M": function(codemirror) {
        that._toggleMeta();
      },
      "Ctrl-S": function(codemirror) {
        that.updatePost(undefined, "Updated " + that.model.file);
      }
    };
  },

  initEditor: function() {
    var that = this;
    setTimeout(function() {

      that.metadataEditor = CodeMirror.fromTextArea(document.getElementById('raw_metadata'), {
        // mode: 'markdown',
        lineWrapping: true,
        extraKeys: that.keyMap(),
        matchBrackets: true,
        theme: 'default',
        onChange: _.bind(that._makeDirty, that)
      });

      $('#post .metadata').hide();

      that.editor = CodeMirror.fromTextArea(document.getElementById('code'), {
        // mode: 'markdown',
        lineWrapping: true,
        extraKeys: that.keyMap(),
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
    if (this.model.metadata.published) $(this.el).addClass('published');
    this.initEditor();
    return this;
  }
});

}).apply(this, window.args);
