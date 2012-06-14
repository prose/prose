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
    if (confirm("Are you sure you want to delete that document?")) {
      deletePost(app.state.user, app.state.repo, app.state.branch, this.model.path, this.model.file, _.bind(function(err) {
        router.navigate([app.state.user, app.state.repo, app.state.branch, this.model.path].join('/'), true);
      }, this));      
    }
    return false;
  },

  updateURL: function() {
    var url = _.compact([app.state.user, app.state.repo, app.state.branch, this.model.path, this.model.file]);

    if (!this.model.preview) url.push('edit');
    router.navigate(url.join('/'), false);
  },

  updateFilename: function(file, cb) {
    var that = this;
    
    if (!_.validFilename(file)) return cb('error');
    app.state.path = this.model.path;
    app.state.file = file;
    // rerender header to reflect the filename change
    app.instance.header.render();
    this.model.file = file;

    function finish() {
      that.updateURL();
      app.state.path = that.model.path + "/" + file;
    }

    if (this.model.persisted) {
      movePost(app.state.user, app.state.repo, app.state.branch, this.model.path + "/" + this.model.file, this.model.path + "/" + file, _.bind(function(err) {
        if (!err) finish()
        err ? cb('error') : cb(null)
      }, this));
    } else {
      finish();
      cb(null);
    }
  },

  _makeDirty: function(e) {
    this.dirty = true;
    if (this.editor) this.model.content = this.editor.getValue();
    // $('.document')[0].scrollLeft = '-100%';
    if (!this.$('.button.save').hasClass('saving')) {
      this.$('.button.save').html('SAVE');
      this.$('.button.save').removeClass('inactive error');      
    }
  },
  
  _save: function(e) {
    if (!this.dirty) return false;
    e.preventDefault();
    this.updatePost('Updated '+ this.model.file);
  },

  _toggleView: function(e) {
    this.toggleView($(e.currentTarget).attr('data-view'))

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
      key('⌘+s, ctrl+s', _.bind(function() { this.updatePost("Updated " + this.model.file); return false; }, this));
      key('ctrl+shift+right', _.bind(function() { this.right(); return false; }, this));
      key('ctrl+shift+left', _.bind(function() { this.left(); return false; }, this));
      key('esc', _.bind(function() { this.toggleView('compose'); return false; }, this));
      window.shortcutsRegistered = true;
    }
  },

  parseMetadata: function(metadata) {
    try {
      return jsyaml.load(this.rawMetadata);
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

    this.rawMetadata = this.metadataEditor.getValue();
    var published = this.$('#post_published').prop('checked');
    var metadata = this.parseMetadata(this.rawMetadata);
    metadata.published = published;

    if (metadata) {
      this.model.metadata = metadata;
      this.rawMetadata = updatePublished(this.rawMetadata, published);
      this.metadataEditor.setValue(this.rawMetadata);
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

  updatePost: function(message) {
    var file = $('input.filename').val();
    var that = this;

    function updateState(label, classes) {
      $('.button.save').html(label)
                       .removeClass('inactive error saving')
                       .addClass(classes);
    }

    function save() {
      if (!app.state.jekyll || that.updateMetaData()) {
        saveFile(app.state.user, app.state.repo, app.state.branch, that.model.path, that.model.file, that.rawMetadata, that.editor.getValue(), message, function(err) {
          if (err) return updateState('! Error', 'error');
          that.dirty = false;
          that.model.persisted = true;
          that.updateURL();
          updateState('SAVED', 'inactive');
        });
      } else {
        updateState('! Metadata', 'error');
      }
    }

    updateState('SAVING ...', 'inactive saving');
    that.$('.document-menu-content .options').hide();

    if (file === this.model.file) return save();    
    this.updateFilename(file, function(err) {
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
        that.updatePost("Updated " + that.model.file);
      }
    };
  },

  initEditor: function() {
    var that = this;
    setTimeout(function() {

      if (app.state.jekyll) {
        that.metadataEditor = CodeMirror.fromTextArea(document.getElementById('raw_metadata'), {
          mode: 'yaml',
          theme: 'prose-dark',
          lineWrapping: true,
          extraKeys: that.keyMap(),
          onChange: _.bind(that._makeDirty, that)
        });
        $('#post .metadata').hide();
      }

      that.editor = CodeMirror.fromTextArea(document.getElementById('code'), {
        mode: that.model.markdown ? "markdown" : null,
        lineWrapping: true,
        extraKeys: that.keyMap(),
        matchBrackets: true,
        theme: 'prose-bright',
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
    $(this.el).html(templates.post(_.extend(this.model, { mode: this.mode, jekyll: app.state.jekyll })));
    if (this.model.metadata.published) $(this.el).addClass('published');
    this.initEditor();
    return this;
  }
});

}).apply(this, window.args);
