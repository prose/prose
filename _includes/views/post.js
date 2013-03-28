(function(config, models, views, routers, utils, templates) {

views.Post = Backbone.View.extend({

  id: 'post',

  events: {
    'click .save': '_save',
    'click .cancel-save': '_toggleCommit',
    'click .save.confirm': 'updateFile',
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
      this.$('.button.save').html(this.model.writeable ? "SAVE" : "SUBMIT CHANGE");
      this.$('.button.save').removeClass('inactive error');
    }
  },

  showDiff: function() {
    var text1 = this.model.persisted ? this.prevContent : '';
    var text2 = this.serialize();
    var d = this.dmp.diff_main(text1, text2);
    this.dmp.diff_cleanupSemantic(d);
    var diff = this.dmp.diff_prettyHtml(d).replace(/&para;/g, "");
    $('.diff-wrapper .diff').html(diff);
  },

  _toggleCommit: function() {
    if (!this.$('.document-menu').hasClass('commit')) {
      this.$('.commit-message').attr( 'placeholder', "Updated "+$('input.filepath').val());
    }

    this.hideMeta();
    this.$('.button.save').html(this.$('.document-menu').hasClass('commit') ? (this.model.writeable ? "SAVE" : "SUBMIT CHANGE") : "COMMIT");
    this.$('.button.save').toggleClass('confirm');
    this.$('.document-menu').toggleClass('commit');
    this.$('.button.cancel-save').toggle();
    this.$('.document-menu-content .options').hide();
    this.showDiff();
    this.$('.surface').toggle();
    this.$('.diff-wrapper').toggle();
    this.$('.commit-message').focus();  

    return false;
  },

  _save: function(e) {
    if (!this.dirty) return false;
    this._toggleCommit();
    e.preventDefault();
    return false;
  },

  _toggleView: function(e) {
    var that = this;
    if ($(e.currentTarget).attr('data-view') === 'preview' &&
      this.model.metadata &&
      this.model.metadata.layout
    ) {
      var hash = window.location.hash.split('/');
      hash[2] = 'preview';
      this.stashFile();
      $(e.currentTarget).attr({ target: '_blank', href: hash.join('/') });
    } else {
      this.toggleView($(e.currentTarget).attr('data-view'));
      _.delay(function() { that.refreshCodeMirror(); }, 1);
      return false;
    }
  },

  _toggleMeta: function(e) {
    var that = this;
    if (e) e.preventDefault();
    $('.toggle.meta').toggleClass('active');
    $('.metadata').toggle();
    _.delay(function() { that.refreshCodeMirror(); }, 1);
    return false;
  },

  refreshCodeMirror: function() {
    if ($('.toggle.meta').hasClass('active')) {
      $('.CodeMirror-scroll').height($('.document').height() / 2);
    } else {
      $('.CodeMirror-scroll').height($('.document').height());
    }
    this.editor.refresh();
    if (this.metadataEditor) this.metadataEditor.refresh();
  },

  toggleView: function(view) {
    this.view = view;
    if (view === 'preview') {
      this.model.preview = true;
      this.$('.post-content').html(marked(this.model.content));
    } else {
      this.model.preview = false;
    }
    this.hideMeta();
    this.updateURL();
    $('.toggle').removeClass('active');
    $('.toggle.'+view).addClass('active');

    $('.document .surface').removeClass('preview cheatsheet compose');
    $('.document .surface').addClass(view);
  },

  hideMeta: function() {
    $('.toggle.meta').removeClass('active');
    $('.metadata').hide();
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
    this.dmp = new diff_match_patch();
    this.mode = "edit";
    this.prevContent = this.serialize();
    if (!window.shortcutsRegistered) {
      key('⌘+s, ctrl+s', _.bind(function() { this.updateFile(); return false; }, this));
      key('ctrl+r', _.bind(function() { this.stashApply(); return false; }, this));
      key('ctrl+shift+right', _.bind(function() { this.right(); return false; }, this));
      key('ctrl+shift+left', _.bind(function() { this.left(); return false; }, this));
      key('esc', _.bind(function() { this.toggleView('compose'); return false; }, this));
      window.shortcutsRegistered = true;
    }

    // Stash editor and metadataEditor content to localStorage on pagehide event
    window.addEventListener('pagehide', this.stashFile, false);
  },

  // TODO: We might not wanna use this
  parseMetadata: function(metadata) {
    var metadata = this.metadataEditor.getValue();
    if (!metadata) return {};
    try {
      return jsyaml.load(metadata);
    } catch(err) {
      return null;
    }
  },

  updateMetaData: function() {
    if (!this.model.jekyll) return true; // metadata -> skip

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

    this.model.raw_metadata = updatePublished(this.model.raw_metadata, published);
    console.log(this.model.raw_metadata);
    this.metadataEditor.setValue(this.model.raw_metadata);

    published ? $('#post').addClass('published') : $('#post').removeClass('published');

    return true;
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

  serialize: function() {
    return serialize(this.model.content, this.model.jekyll ? this.model.raw_metadata : null)
  },

  // Update save state (saving ..., sending patch ..., etc.)

  updateSaveState: function(label, classes) {
    $('.button.save').html(label)
                     .removeClass('inactive error saving')
                     .addClass(classes);
  },

  // Submits a patch (fork + pull request workflow)

  sendPatch: function(filepath, filename, filecontent, message) {
    var that = this;

    function patch() {
      if (that.updateMetaData()) {
        that.model.content = that.prevContent;
        console.log(that.prevContent);
        that.editor.setValue(that.prevContent);

        patchFile(app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, function(err) {
          if (err) {
            _.delay(function() {
              that.$('.button.save').html("SUBMIT CHANGE");
              that.$('.button.save').removeClass('error');
              that.$('.button.save').addClass('inactive');
            }, 3000);
            that.updateSaveState('! Try again in 30 seconds', 'error');
            return;
          }

          that.dirty = false;
          that.model.persisted = true;
          that.model.file = filename;
          that.updateURL();
          that.prevContent = filecontent;
          that.updateSaveState('CHANGE SUBMITTED', 'inactive');
        });
      } else {
        that.updateSaveState('! Metadata', 'error');
      }
    }

    that.updateSaveState('SUBMITTING CHANGE ...', 'inactive saving');
    patch();

    return false;
  },

  saveFile: function(filepath, filename, filecontent, message) {
    var that = this;

    function save() {
      if (that.updateMetaData()) {
        saveFile(app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, function(err) {
          if (err) {
            _.delay(function() { that._makeDirty() }, 3000);
            that.updateSaveState('! Try again in 30 seconds', 'error');
            return;
          }
          that.dirty = false;
          that.model.persisted = true;
          that.model.file = filename;
          that.updateURL();
          that.prevContent = filecontent;
          that.updateSaveState('SAVED', 'inactive');
        });
      } else {
        that.updateSaveState('! Metadata', 'error');
      }
    }

    that.updateSaveState('SAVING ...', 'inactive saving');

    if (filepath === _.filepath(this.model.path, this.model.file)) return save();

    // Move or create file
    this.updateFilename(filepath, function(err) {
      err ? that.updateSaveState('! Filename', 'error') : save();
    });
  },

  stashFile: function(event) {
    if (event) event.preventDefault();

    console.log(event, window.localStorage);

    if (!window.localStorage) return false;

    var storage = window.localStorage,
        filepath = $('input.filepath').val(),
        filecontent = this.serialize();

    storage.setItem(filepath, JSON.stringify({
      sha: app.state.sha,
      content: this.editor ? this.editor.getValue() : null,
      raw_metadata: this.model.jekyll && this.metadataEditor ? this.metadataEditor.getValue() : null
    }));
  },

  stashApply: function() {
    if (!window.localStorage) return false;

    var storage = window.localStorage,
        filepath = $('input.filepath').val();

    var stash = JSON.parse(storage.getItem(filepath));

    if (stash && stash.sha === app.state.sha) {
      if (this.editor) this.editor.setValue(stash.content);
      if (this.metadataEditor) this.metadataEditor.setValue(stash.raw_metadata);
    } else {
      storage.delItem(filepath);
    }
  },

  updateFile: function() {
    var that = this,
        filepath = $('input.filepath').val(),
        filename = _.extractFilename(filepath)[1],
        filecontent = this.serialize(),
        message = this.$('.commit-message').val() || this.$('.commit-message').attr('placeholder'),
        method = this.model.writeable ? this.saveFile : this.sendPatch;

    // Update content
    this.model.content = this.editor.getValue();

    // Delegate
    method.call(this, filepath, filename, filecontent, message);
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
        that.updateFile();
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
          lineNumbers: true,
          extraKeys: that.keyMap(),
          onChange: _.bind(that._makeDirty, that)
        });
        $('#post .metadata').hide();
      }
      that.editor = CodeMirror($('#code')[0], {
        mode: that.model.lang,
        value: that.model.content,
        lineWrapping: true,
        lineNumbers: true,
        extraKeys: that.keyMap(),
        matchBrackets: true,
        theme: 'prose-bright',
        onChange: _.bind(that._makeDirty, that)
      });
      that.refreshCodeMirror();
    }, 100);
  },

  render: function() {
    var that = this;
    $(this.el).html(templates.post(_.extend(this.model, { mode: this.mode })));
    if (this.model.published) $(this.el).addClass('published');
    this.initEditor();
    return this;
  }
});

}).apply(this, window.args);
