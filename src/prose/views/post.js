var $ = require('jquery-browserify');
var chosen = require('chosen-jquery-browserify');
var _ = require('underscore');
var jsyaml = require('js-yaml');
var key = require('keymaster');
var marked = require('marked');
var Backbone = require('backbone');
var utils = require('.././util');

module.exports = Backbone.View.extend({

    id: 'post',
    className: 'post',

    events: {
      'click .save.confirm': 'updateFile',
      'click .markdown-snippets a': 'markdownSnippet',
      'change input': 'makeDirty'
    },

    initialize: function () {
      this.dmp = new diff_match_patch();
      this.mode = 'edit';
      this.prevContent = this.serialize();
      if (!window.shortcutsRegistered) {
        key('⌘+s, ctrl+s', _.bind(function () {
          this.updateFile();
          return false;
        }, this));
        window.shortcutsRegistered = true;
      }

      // Stash editor and metadataEditor content to localStorage on pagehide event
      // Always run stashFile in context of view
      $(window).on('pagehide', _.bind(this.stashFile, this));
    },

    render: function() {
      var data = _.extend(this.model, {
        mode: this.mode,
        preview: this.model.markdown ? marked(this.model.content) : '',
        metadata: this.model.metadata
      });

      this.eventRegister = app.eventRegister;

      // Listen for button clicks from the vertical nav
       _.bindAll(this, 'edit', 'preview', 'deleteFile', 'updateMetaData', 'save', 'hideDiff', 'translate', 'updateFile', 'meta');
      this.eventRegister.bind('edit', this.edit);
      this.eventRegister.bind('preview', this.preview);
      this.eventRegister.bind('deleteFile', this.deleteFile);
      this.eventRegister.bind('updateMetaData', this.updateMetaData);
      this.eventRegister.bind('save', this.save);
      this.eventRegister.bind('hideDiff', this.hideDiff);
      this.eventRegister.bind('updateFile', this.updateFile);
      this.eventRegister.bind('translate', this.translate);
      this.eventRegister.bind('meta', this.meta);

      // Ping `views/app.js` to let know we should swap out the sidebar
      this.eventRegister.trigger('sidebarContext', data, 'post');

      // Render heading
      var isPrivate = app.state.isPrivate ? 'private' : '';

      var header = {
        avatar: '<span class="icon round file ' + isPrivate + '"></span>',
        parent: app.state.repo,
        parentUrl: app.state.user + '/' + app.state.repo,
        title: _.filepath(data.path, data.file),
        titleUrl: '#',
        alterable: true
      };

      this.eventRegister.trigger('headerContext', header);

      var tmpl = _(window.app.templates.post).template();

      $(this.el)
        .empty()
        .append(tmpl(_.extend(this.model, {
          mode: this.mode,
          metadata: this.model.metadata
        })));

      // TODO Add an unpublished class to .application
      if (!this.model.published) $(this.el).addClass('published');

      this.initEditor();

      // Editor is first up so trigger an active class for it
      $('.post-views .edit').toggleClass('active', true);

      _.delay(function () {
        utils.fixedScroll($('.topbar'));
      }, 1);

      return this;
    },

    edit: function(e) {
      var that = this;
      this.model.preview = false;

      this.toolbar.prependTo($('#post'));

      $('.post-views a').removeClass('active');
      $('.post-views .edit').addClass('active');
      $('#prose').toggleClass('open', false);

      $('.views .view').removeClass('active');
      $('.views .edit').addClass('active');
      this.updateURL();

      // Refresh CodeMirror each time
      // to reflect new changes
      _.delay(function () {
        that.refreshCodeMirror();
      }, 1);

      return false;
    },

    preview: function(e) {
      var that = this;
      this.model.preview = true;

      $('#prose').toggleClass('open', false);

      if (this.model.metadata && this.model.metadata.layout) {

        var hash = window.location.hash.split('/');
        hash[2] = 'preview';
        this.stashFile();

        $(e.currentTarget).attr({
          target: '_blank',
          href: hash.join('/')
        });

      } else {

        this.toolbar = $('.topbar-wrapper').detach();

        // Vertical Nav
        $('.post-views a').removeClass('active');
        $('.post-views .preview').addClass('active');

        // Content Window
        $('.views .view', this.el).removeClass('active');
        $('#preview', this.el).addClass('active');

        this.$('.preview').html(marked(this.model.content));
        this.updateURL();
      }

      // Refresh CodeMirror each time
      // to reflect new changes
      _.delay(function () {
        that.refreshCodeMirror();
      }, 1);
    },

    meta: function() {

      $('#prose').toggleClass('open', false);
      this.toolbar = $('.toolbar').detach();

      // Vertical Nav
      $('.post-views a').removeClass('active');
      $('.post-views .meta').addClass('active');

      // Content Window
      $('.views .view', this.el).removeClass('active');
      $('#meta', this.el).addClass('active');
    },

    deleteFile: function() {
      if (confirm('Are you sure you want to delete that file?')) {
        window.app.models.deletePost(app.state.user, app.state.repo, app.state.branch, this.model.path, this.model.file, _.bind(function (err) {
          if (err) return alert('Error during deletion. Please wait 30 seconds and try again.');
          router.navigate([app.state.user, app.state.repo, 'tree', app.state.branch].join('/'), true);
        }, this));
      }
      return false;
    },

    updateURL: function() {
      var url = _.compact([app.state.user, app.state.repo, this.model.preview ? "blob" : "edit", app.state.branch, this.model.path, this.model.file]);
      router.navigate(url.join('/'), false);
    },

    makeDirty: function(e) {
      this.dirty = true;
      if (this.editor) this.model.content = this.editor.getValue();
      if (this.metadataEditor) this.model.raw_metadata = this.metadataEditor.getValue();
      if (!this.$('.button.save').hasClass('saving')) {
        this.$('.button.save').html(this.model.writeable ? 'Save' : 'Submit Change');
        this.$('.button.save').removeClass('inactive error');
      }
    },

    showDiff: function() {
      var $diff = $('#diff', this.el);
      var text1 = this.model.persisted ? this.prevContent : '';
      var text2 = this.serialize();
      var d = this.dmp.diff_main(text1, text2);
      this.dmp.diff_cleanupSemantic(d);
      var diff = this.dmp.diff_prettyHtml(d).replace(/&para;/g, '');

      // Content Window
      $('.views .view', this.el).removeClass('active');
      $diff.addClass('active');

      $diff.html(diff);
    },

    hideDiff: function() {
      $('.views .view', this.el).removeClass('active');

      if (this.model.mode === 'preview') {
        $('#preview', this.el).addClass('active');
      } else {
        $('#code', this.el).addClass('active');
      }
    },

    save: function() {
      if (!this.dirty) return false;
      this.showDiff();
      return false;
    },

    refreshCodeMirror: function () {
      $('.CodeMirror-scroll').height($('.document').height());
      this.editor.refresh();
      // if (this.metadataEditor) this.metadataEditor.refresh();
    },

    updateMetaData: function () {
      if (!this.model.jekyll) return true; // metadata -> skip

      // Update published
      // TODO: refactor to use this.model.metadata instead of raw YAML
      function updatePublished(yamlStr, published) {
        var regex = /published: (false|true)/;
        if (yamlStr.match(regex)) {
          return yamlStr.replace(regex, 'published: ' + !! published);
        } else {
          return yamlStr + '\npublished: ' + !! published;
        }
      }

      this.model.raw_metadata = this.metadataEditor.getValue();
      var published = $('#meta input[name="published"]').prop('checked');

      this.model.published = this.model.metadata.published = published;
      this.model.raw_metadata = updatePublished(this.model.raw_metadata, published);
      this.metadataEditor.setValue(this.model.raw_metadata);

      if (published) {
        $('#post').addClass('published');
      } else {
        $('#post').removeClass('published');
      }

      return true;
    },

    updateFilename: function (filepath, cb) {
      var that = this;

      if (!_.validPathname(filepath)) return cb('error');
      app.state.path = this.model.path; // ?
      app.state.file = _.extractFilename(filepath)[1];
      app.state.path = _.extractFilename(filepath)[0];

      function finish() {
        that.model.path = app.state.path;
        that.model.file = app.state.file;
        // re-render header to reflect the filename change
        app.instance.app.render();
        that.updateURL();
      }

      if (this.model.persisted) {
        window.app.models.movePost(app.state.user, app.state.repo, app.state.branch, _.filepath(this.model.path, this.model.file), filepath, _.bind(function (err) {
          if (!err) finish();
          if (err) {
            cb('error');
          } else {
            cb(null);
          }
        }, this));
      } else {
        finish();
        cb(null);
      }
    },

    serialize: function () {
      return window.app.models.serialize(this.model.content, this.model.jekyll ? this.model.raw_metadata : null);
    },

    // Update save state (saving ..., sending patch ..., etc.)

    updateSaveState: function (label, classes) {
      $('.button.save').html(label)
        .removeClass('inactive error saving')
        .addClass(classes);
    },

    // Submits a patch (fork + pull request workflow)

    sendPatch: function (filepath, filename, filecontent, message) {
      var that = this;

      function patch() {
        if (that.updateMetaData()) {
          that.model.content = that.prevContent;
          that.editor.setValue(that.prevContent);

          window.app.models.patchFile(app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, function (err) {
            if (err) {
              _.delay(function () {
                that.$('.button.save').html('Submit Change');
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
            that.updateSaveState('Change Submitted', 'inactive');
          });
        } else {
          that.updateSaveState('! Metadata', 'error');
        }
      }

      that.updateSaveState('Submitting Change ...', 'inactive saving');
      patch();

      return false;
    },

    saveFile: function (filepath, filename, filecontent, message) {
      var that = this;

      function save() {
        if (that.updateMetaData()) {
          window.app.models.saveFile(app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, function (err) {
            if (err) {
              _.delay(function () {
                that.makeDirty();
              }, 3000);
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

      that.updateSaveState('Saving ...', 'inactive saving');

      if (filepath === _.filepath(this.model.path, this.model.file)) return save();

      // Move or create file
      this.updateFilename(filepath, function (err) {
        if (err) {
          that.updateSaveState('! Filename', 'error');
        } else {
          save();
        }
      });
    },

    stashFile: function(e) {
      if (e) e.preventDefault();
      if (!window.localStorage || !this.dirty) return false;

      var store = window.localStorage;
      var filepath = $('input.filepath').val();

      // Don't stash if filepath is undefined
      if (filepath) {
        try {
          store.setItem(filepath, JSON.stringify({
            sha: app.state.sha,
            content: this.editor ? this.editor.getValue() : null,
            raw_metadata: this.model.jekyll && this.metadataEditor ? this.metadataEditor.getValue() : null
          }));
        } catch(err) {
          console.log(err);
        }
      }
    },

    stashApply: function () {
      if (!window.localStorage) return false;

      var store = window.localStorage;
      var filepath = $('input.filepath').val();
      var item = store.getItem(filepath);
      var stash = JSON.parse(item);

      if (stash && stash.sha === window.app.state.sha) {
        // Restore from stash if file sha hasn't changed
        if (this.editor) this.editor.setValue(stash.content);
        if (this.metadataEditor) this.metadataEditor.setValue(stash.raw_metadata);
      } else if (item) {
        // Remove expired content
        store.removeItem(filepath);
      }
    },

    updateFile: function() {
      var that = this;
      var filepath = $('input.filepath').val();
      var filename = _.extractFilename(filepath)[1];
      var filecontent = this.serialize();
      var message = $('.commit-message').val() || $('.commit-message').attr('placeholder');
      var method = this.model.writeable ? this.saveFile : this.sendPatch;

      // Update content
      this.model.content = this.editor.getValue();

      // Delegate
      method.call(this, filepath, filename, filecontent, message);
    },

    keyMap: function () {
      var that = this;
      return {
        'Ctrl-S': function (codemirror) {
          that.updateFile();
        }
      };
    },

    translate: function(e) {

      // TODO Drop the 'EN' requirement.
      var hash = window.location.hash.split('/'),
          href = $(e.currentTarget).attr('href').substr(1);

      // If current page is not english and target page is english
      if (href === 'en') {
        hash.splice(-2, 2, hash[hash.length - 1]);
      // If current page is english and target page is not english
      } else if (this.model.metadata.lang === 'en') {
        hash.splice(-1, 1, href, hash[hash.length - 1]);
      // If current page is not english and target page is not english
      } else {
        hash.splice(-2, 2, href, hash[hash.length - 1]);
      }

      router.navigate(_(hash).compact().join('/'), true);

      return false;
    },

    buildMeta: function() {
      var $metadataEditor = $('#meta', this.el);
      $metadataEditor.empty();

      function initialize(model) {
        var tmpl;

        tmpl = _(window.app.templates.checkbox).template();
        $metadataEditor.append(tmpl({
          name: 'published',
          label: 'Published',
          value: 'published',
          checked: model.published
        }));

        _(model.default_metadata).each(function(data) {
          if (data && typeof data.field === 'object') {
            switch(data.field.element) {
              case 'boolean':
                tmpl = _(window.app.templates.checkbox).template();
                $metadataEditor.append(tmpl({
                  name: data.name,
                  label: data.field.label,
                  value: data.name,
                  checked: data.field.value
                }));
                break;
              case 'input':
                tmpl = _(window.app.templates.text).template();
                $metadataEditor.append(tmpl({
                  name: data.name,
                  label: data.field.label,
                  value: data.field.value
                }));
                break;
              case 'select':
                tmpl = _(window.app.templates.select).template();
                $metadataEditor.append(tmpl({
                  name: data.name,
                  label: data.field.label,
                  placeholder: data.field.placeholder,
                  options: data.field.options,
                  lang: model.metadata.lang || 'en'
                }));
                break;
              case 'multiselect':
                tmpl = _(window.app.templates.multiselect).template();
                $metadataEditor.append(tmpl({
                  name: data.name,
                  label: data.field.label,
                  placeholder: data.field.placeholder,
                  options: data.field.options,
                  lang: model.metadata.lang || 'en'
                }));
              break;
            }
          } else {
            tmpl = _(window.app.templates.text).template();
            $metadataEditor.append(tmpl({
              name: key,
              label: key,
              value: data
            }));
          }
        });

        setValue(model.metadata);
        $('.chzn-select').chosen();
      }

      function getValue() {
        var metadata = {};

        _.each($metadataEditor.find('[name]'), function(item) {
          switch(item.tagName.toLowerCase()) {
            case 'input':
              if (item.type === 'text') {
                metadata[item.name] = item.value;
              }
              break;
            case 'select':
            case 'multiselect':
              metadata[item.name] = item.value;
              break;
          }
        });

        return metadata;
      }

      function getRaw() {
        return jsyaml.dump(getValue());
      }

      function setValue(metadata) {
        _(metadata).each(function(value, key) {
          var input = $metadataEditor.find('[name="' + key + '"]');
          var options = $metadataEditor.find('[name="' + key +'"] option');

          if (input.length && options.length) {
            _.each(options, function(option) {
              if (value !== null && (option.value === value || value.indexOf(option.value) > -1)) {
                option.selected = 'selected';
              }
            });
          } else if (input.length) {
            input.val(value);
          } else {
            var tmpl = _(window.app.templates.text).template();
            $metadataEditor.append(tmpl({
              name: key,
              label: key,
              value: value
            }));
          }
        });
      }

      function setRaw(rawMetadata) {
        try {
          setValue(jsyaml.load(rawMetadata));
        } catch(err) {
          console.log('ERROR encoding YAML');
          // No-op
        }
      }

      initialize(this.model);

      return {
        el: $metadataEditor,
        getValue: getRaw,
        setValue: setRaw
      };
    },

    initEditor: function () {
      var that = this;

      // TODO Remove setTimeout
      setTimeout(function () {
        if (that.model.jekyll) {
          that.metadataEditor = that.buildMeta();
          /*
          that.metadataEditor = CodeMirror($('#meta')[0], {
            mode: 'yaml',
            value: that.model.raw_metadata,
            theme: 'prose-dark',
            lineWrapping: true,
            extraKeys: that.keyMap(),
            onChange: _.bind(that.makeDirty, that)
          });
          */
          $('#post .metadata').hide();
        }

        that.editor = CodeMirror($('#code')[0], {
          mode: that.model.lang,
          value: that.model.content,
          lineWrapping: true,
          autofocus: true,
          extraKeys: that.keyMap(),
          matchBrackets: true,
          theme: 'prose-bright',
          onChange: _.bind(that.makeDirty, that)
        });
        that.refreshCodeMirror();

        // Check localStorage for existing stash
        // Apply if stash exists and is current, remove if expired
        that.stashApply();
      }, 100);
    },

    remove: function () {
      // Unbind pagehide event handler when View is removed
      this.eventRegister.unbind('edit', this.postViews);
      this.eventRegister.unbind('preview', this.preview);
      this.eventRegister.unbind('deleteFile', this.deleteFile);
      this.eventRegister.unbind('updateMetaData', this.updateMetaData);
      this.eventRegister.unbind('save', this.save);
      this.eventRegister.unbind('hideDiff', this.hideDiff);
      this.eventRegister.unbind('translate', this.translate);
      this.eventRegister.unbind('updateFile', this.updateFile);
      this.eventRegister.unbind('meta', this.updateFile);

      $(window).unbind('pagehide');
      Backbone.View.prototype.remove.call(this);
    },

    markdownSnippet: function(e) {
      var snippet = $(e.target, this.el).data('snippet');
      if (!snippet) return;
      this.editor.replaceSelection(snippet);
      return false;
    }
});
