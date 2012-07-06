(function(config, models, views, routers, utils, templates) {

views.Post = Backbone.View.extend({

  id: 'post',

  events: {
    'click .save': '_save',
    'click a.toggle.view': '_toggleView',
    'click a.toggle.meta': '_toggleMeta',
    'change input': '_makeDirty',
    'change #post_published': 'updateMetaData',
    'click .delete': '_delete',
    'click .toggle-options': '_toggleOptions'
  },

  _toggleOptions: function() {
    $('.options').toggle();
    return false;
  },

  _delete: function() {
    if (confirm("Are you sure you want to delete that file?")) {
      deletePost(app.state.user, app.state.repo, app.state.branch, this.model.path, this.model.file, _.bind(function(err) {
        if (err) return alert('Error during deletion. Please wait 30 seconds and try again.');
        router.navigate([app.state.user, app.state.repo, "tree", app.state.branch].join('/'), true);
      }, this));      
    }
    return false;
  },

  updateURL: function() {
    var url = _.compact([app.state.user, app.state.repo, this.model.preview ? "blob" : "edit", app.state.branch, this.model.path, this.model.file]);
    router.navigate(url.join('/'), false);
  },

  _makeDirty: function(e) {
    this.dirty = true;
    if (this.editor) this.model.content = this.editor.getValue();
    if (this.metadataEditor) this.model.raw_metadata = this.metadataEditor.getValue();
    if (!this.$('.button.save').hasClass('saving')) {
      this.$('.button.save').html('SAVE');
      this.$('.button.save').removeClass('inactive error');      
    }
  },
  
  _save: function(e) {
    if (!this.dirty) return false;
    e.preventDefault();
    this.updatePost();
  },

  _toggleView: function(e) {
    this.toggleView($(e.currentTarget).attr('data-view'));

    // Refresh CodeMirror instances
    this.editor.refresh();
    if (this.metadataEditor) this.metadataEditor.refresh();
    return false;
  },

  _toggleMeta: function(e) {
    if (e) e.preventDefault();
    $('.toggle.meta').toggleClass('active');
    $('.metadata').toggle();

    return false;
  },

  toggleView: function(view) {
    this.view = view;
    if (view === 'preview') {
      this.model.preview = true;
      this.$('.post-content').html(marked(this.model.content));
    } else {
      this.model.preview = false;
    }
    this.updateURL();
    $('.toggle').removeClass('active');
    $('.toggle.'+view).addClass('active');

    $('.document .surface').removeClass('preview cheatsheet compose');
    $('.document .surface').addClass(view);
  },

  right: function() {
    var view = $('.toggle.active').attr('data-view');
    if (view === 'preview') return;
    if (view === 'compose') return this.toggleView('preview');
    return this.toggleView('compose');
  },

  left: function() {
    var view = $('.toggle.active').attr('data-view');
    if (view === 'cheatsheet') return;
    if (view === 'compose') return this.toggleView('cheatsheet');
    return this.toggleView('compose');
  },

  initialize: function() {
    this.mode = "edit";
    if (!window.shortcutsRegistered) {
      key('⌘+s, ctrl+s', _.bind(function() { this.updatePost(); return false; }, this));
      key('ctrl+shift+right', _.bind(function() { this.right(); return false; }, this));
      key('ctrl+shift+left', _.bind(function() { this.left(); return false; }, this));
      key('esc', _.bind(function() { this.toggleView('compose'); return false; }, this));
      window.shortcutsRegistered = true;
    }
  },

  parseMetadata: function(metadata) {
    var metadata = this.metadataEditor.getValue();
    if (!metadata) return {};
    try {
      return jsyaml.load(metadata);
    } catch(err) {
      return null;
    }
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

    this.model.raw_metadata = this.metadataEditor.getValue();
    var published = this.$('#post_published').prop('checked');
    var metadata = this.parseMetadata(this.model.raw_metadata);
    if (metadata) {
      metadata.published = published;
      this.model.metadata = metadata;
      this.model.raw_metadata = updatePublished(this.model.raw_metadata, published);
      this.metadataEditor.setValue(this.model.raw_metadata);

      if (this.model.metadata.published) {
        $('#post').addClass('published');
      } else {
        $('#post').removeClass('published');
      }
      return true;
    } else {
      return false;
    }
  },

  updateFilename: function(filepath, cb) {
    var that = this;
    
    if (!_.validPathname(filepath)) return cb('error');
    app.state.path = this.model.path; // ?
    app.state.file = _.extractFilename(filepath)[1];
    app.state.path = _.extractFilename(filepath)[0];

    function finish() {
      that.model.path = app.state.path;
      that.model.file = app.state.file;
      // rerender header to reflect the filename change
      app.instance.header.render();
      that.updateURL();
    }

    if (this.model.persisted) {
      movePost(app.state.user, app.state.repo, app.state.branch, _.filepath(this.model.path, this.model.file), filepath, _.bind(function(err) {
        if (!err) finish()
        err ? cb('error') : cb(null)
      }, this));
    } else {
      finish();
      cb(null);
    }
  },

  updatePost: function() {
    var filepath = $('input.filepath').val();

    var file = _.extractFilename(filepath)[1];
    var that = this;
    var message = this.model.persisted ? "Updated " + filepath : "Created " + filepath;

    function updateState(label, classes) {
      $('.button.save').html(label)
                       .removeClass('inactive error saving')
                       .addClass(classes);
    }

    function save() {
      if (!that.model.jekyll || that.updateMetaData()) {

        saveFile(app.state.user, app.state.repo, app.state.branch, filepath, that.model.raw_metadata, that.editor.getValue(), message, function(err) {
          if (err) {
            _.delay(function() { that._makeDirty() }, 3000);
            updateState('! Try again in 30 seconds', 'error');
            return;
          }
          that.dirty = false;
          that.model.persisted = true;
          that.model.file = file;
          that.updateURL();
          updateState('SAVED', 'inactive');
        });
      } else {
        updateState('! Metadata', 'error');
      }
    }

    updateState('SAVING ...', 'inactive saving');
    that.$('.document-menu-content .options').hide();

    if (filepath === _.filepath(this.model.path, this.model.file)) return save();
    // Move or create file
    this.updateFilename(filepath, function(err) {
      err ? updateState('! Filename', 'error') : save();
    });
  },

  keyMap: function() {
    var that = this;
    return {
      "Shift-Ctrl-Left": function(codemirror) {
        that.left();
      },
      "Shift-Ctrl-Right": function(codemirror) {
        that.right();
      },
      "Shift-Ctrl-M": function(codemirror) {
        that._toggleMeta();
      },
      "Ctrl-S": function(codemirror) {
        that.updatePost();
      }
    };
  },

  initEditor: function() {
    var that = this;
    setTimeout(function() {
      if (that.model.jekyll) {
        that.metadataEditor = CodeMirror($('#raw_metadata')[0], {
          mode: 'yaml',
          value: that.model.raw_metadata,
          theme: 'prose-dark',
          lineWrapping: true,
          extraKeys: that.keyMap(),
          onChange: _.bind(that._makeDirty, that)
        });
        $('#post .metadata').hide();
      }
      that.editor = CodeMirror($('#code')[0], {
        mode: that.model.lang,
        value: that.model.content,
        lineWrapping: true,
        extraKeys: that.keyMap(),
        matchBrackets: true,
        theme: 'prose-bright',
        onChange: _.bind(that._makeDirty, that)
      });

    }, 100);
  },

  render: function() {
    var that = this;
    $(this.el).html(templates.post(_.extend(this.model, { mode: this.mode })));
    if (this.model.metadata && this.model.metadata.published) $(this.el).addClass('published');
    this.initEditor();
    return this;
  }
});

}).apply(this, window.args);
