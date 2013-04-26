var $ = require('jquery-browserify');
var chosen = require('chosen-jquery-browserify');
var _ = require('underscore');
var jsyaml = require('js-yaml');
var key = require('keymaster');
var marked = require('marked');
var diff = require('diff');
var Backbone = require('backbone');
var utils = require('.././util');

module.exports = Backbone.View.extend({

    id: 'post',

    // TODO Maybe:
    // id: window.authenticated ? 'post' : 'read-post',
    className: 'post',

    events: {
      'click .update': 'saveMeta',
      'click .markdown-snippets a': 'markdownSnippet',
      'change input': 'makeDirty'
    },

    initialize: function() {
      var that = this;
      this.mode = 'edit';
      this.prevFile = this.serialize();
      this.model.original = this.model.content;

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

      // Key Binding support.
      key('⌘+s, ctrl+s', 'file', _.bind(function() {
        that.updateFile();
        return false;
      }, this));

      // Attach Keybindings to the current scope
      key.setScope('file');

      this.eventRegister = app.eventRegister;

      // Listen for button clicks from the vertical nav
       _.bindAll(this, 'edit', 'preview', 'deleteFile', 'save', 'hideDiff', 'translate', 'updateFile', 'meta');
      this.eventRegister.bind('edit', this.edit);
      this.eventRegister.bind('preview', this.preview);
      this.eventRegister.bind('deleteFile', this.deleteFile);
      this.eventRegister.bind('save', this.save);
      this.eventRegister.bind('hideDiff', this.hideDiff);
      this.eventRegister.bind('updateFile', this.updateFile);
      this.eventRegister.bind('translate', this.translate);
      this.eventRegister.bind('meta', this.meta);

      // Ping `views/app.js` to let know we should swap out the sidebar
      this.eventRegister.trigger('sidebarContext', data, 'post');

      // Render heading
      var isPrivate = app.state.isPrivate ? true : false;
      var parentTrail = '<a href="#' + app.state.user + '">' + app.state.user + '</a> / <a href="#' + app.state.user + '/' + app.state.repo + '">' + app.state.repo + '</a>';

      var header = {
        avatar: '<span class="icon round file ' + data.lang + '"></span>',
        parentTrail: parentTrail,
        isPrivate: isPrivate,
        title: _.filepath(data.path, data.file),
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

      if (this.model.markdown) {
        _.delay(function () {
          utils.fixedScroll($('.topbar'));
        }, 1);
      }

      return this;
    },

    edit: function(e) {
      var that = this;

      // We want to trigger a re-rendering of the url
      // if mode is set to preview
      if (this.model.preview) {
        this.model.preview = false;
        this.updateURL();
      }

      $('.post-views a').removeClass('active');
      $('.post-views .edit').addClass('active');
      $('#prose').toggleClass('open', false);

      $('.views .view').removeClass('active');
      $('.views .edit').addClass('active');

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

      // Vertical Nav
      $('.post-views a').removeClass('active');
      $('.post-views .meta').addClass('active');

      // Content Window
      $('.views .view', this.el).removeClass('active');
      $('#meta', this.el).addClass('active');

      // Refresh CodeMirror
      if (this.rawEditor) this.rawEditor.refresh();
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
      var url = _.compact([app.state.user, app.state.repo, this.model.preview ? 'blob' : 'edit', app.state.branch, this.model.path, this.model.file]);
      router.navigate(url.join('/'), {
        trigger: false,
        replace: true
      });
    },

    makeDirty: function(e) {
      this.dirty = true;
      if (this.editor) this.model.content = this.editor.getValue();
      if (this.metadataEditor) this.model.metadata = this.metadataEditor.getValue();

      var saveState = this.model.writeable ? 'Save' : 'Submit Change';
      this.eventRegister.trigger('updateSave', saveState);
    },

    showDiff: function() {
      var $diff = $('#diff', this.el);
      var text1 = this.model.persisted ? this.prevFile : '';
      var text2 = this.serialize();
      var d = diff.diffWords(text1, text2);
      var compare = '';

      for (var i = 0; i < d.length; i++) {
        if (d[i].removed) {
          compare += '<del>' + d[i].value + '</del>';
        } else if (d[i].added) {
          compare += '<ins>' + d[i].value + '</ins>';
        } else {
          compare += d[i].value;
        }
      }

      // Content Window
      $('.views .view', this.el).removeClass('active');
      $diff.html('<pre>' + compare + '</pre>');
      $diff.addClass('active');
    },

    hideDiff: function() {
      $('.views .view', this.el).removeClass('active');

      if (this.model.mode === 'preview') {
        $('.preview', this.el).addClass('active');
      } else {
        $('.edit', this.el).addClass('active');
      }
    },

    save: function() {
      this.showDiff();
    },

    refreshCodeMirror: function() {
      this.editor.refresh();
    },

    updateMetaData: function() {
      if (!this.model.jekyll) return true; // metadata -> skip

      this.model.metadata = this.metadataEditor.getValue();

      if (this.model.metadata.published) {
        $('#post').addClass('published');
      } else {
        $('#post').removeClass('published');
      }

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

    serialize: function() {
      var metadata = this.metadataEditor ? this.metadataEditor.getRaw() : jsyaml.dump(this.model.metadata);

      if (this.model.jekyll) {
        return ['---', metadata, '---'].join('\n') + '\n\n' + this.model.content;
      } else {
        return this.model.content;
      }
    },

    sendPatch: function(filepath, filename, filecontent, message) {
      // Submits a patch (fork + pull request workflow)

      var that = this;

      function patch() {
        if (that.updateMetaData()) {
          that.model.content = that.prevFile;
          that.editor.setValue(that.prevFile);

          window.app.models.patchFile(app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, function (err) {
            if (err) {
              _.delay(function () {
                that.eventRegister.trigger('updateSaveState', 'Submit Change', 'inactive');
              }, 3000);

              that.eventRegister.trigger('updateSaveState', '! Try again in 30 seconds', 'error');
              return;
            }

            that.dirty = false;
            that.model.persisted = true;
            that.model.file = filename;
            that.updateURL();
            that.prevFile = filecontent;
            that.eventRegister.trigger('Change Submitted', 'inactive');
          });
        } else {
          that.eventRegister.trigger('! Metadata', 'error');
        }
      }

      that.eventRegister.trigger('updateSaveState', 'Submitting Change', 'inactive saving');
      patch();

      return false;
    },

    saveFile: function(filepath, filename, filecontent, message) {
      var that = this;

      function save() {
        if (that.updateMetaData()) {
          window.app.models.saveFile(app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, function (err) {
            if (err) {
              _.delay(function () {
                that.makeDirty();
              }, 3000);
              that.eventRegister.trigger('updateSaveState', '! Try again in 30 seconds', 'error');
              return;
            }
            that.dirty = false;
            that.model.persisted = true;
            that.model.file = filename;
            that.updateURL();
            that.prevFile = filecontent;
            that.model.original = that.model.content;
            that.eventRegister.trigger('updateSaveState', 'Saved', 'inactive');
          });
        } else {
          that.eventRegister.trigger('updateSaveState', '! Metadata', 'error');
        }
      }

      that.eventRegister.trigger('updateSaveState', 'Saving', 'inactive saving');

      if (filepath === _.filepath(this.model.path, this.model.file)) return save();

      // Move or create file
      this.updateFilename(filepath, function (err) {
        if (err) {
          that.eventRegister.trigger('updateSaveState', '! Filename', 'error');
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
            metadata: this.model.jekyll && this.metadataEditor ? this.metadataEditor.getValue() : null
          }));
        } catch(err) {
          console.log(err);
        }
      }
    },

    stashApply: function() {
      if (!window.localStorage) return false;

      var store = window.localStorage;
      var filepath = $('input.filepath').val();
      var item = store.getItem(filepath);
      var stash = JSON.parse(item);

      if (stash && stash.sha === window.app.state.sha) {
        // Restore from stash if file sha hasn't changed
        if (this.editor) this.editor.setValue(stash.content);
        if (this.metadataEditor) this.metadataEditor.setValue(stash.metadata);
      } else if (item) {
        // Remove expired content
        store.removeItem(filepath);
      }
    },

    saveMeta: function() {
      var filepath = $('input.filepath').val();
      var filename = _.extractFilename(filepath)[1];
      var defaultMessage = 'Updated metadata for ' + filename;
      var message = $('.commit-message').val() || defaultMessage;
      var method = this.model.writeable ? this.saveFile : this.sendPatch;

      // We want to update the metadata but not the current edited content.
      var filecontent =  window.app.models.serialize(this.model.original, this.model.raw_metadata);

      // Update content
      this.model.content = this.editor.getValue();

      // Delegate
      method.call(this, filepath, filename, filecontent, message);

      $('.post-views a').removeClass('active');
      $('.post-views .edit').addClass('active');
      $('#prose').toggleClass('open', false);

      $('.views .view').removeClass('active');
      $('.views .edit').addClass('active');

      return false;
    },

    updateFile: function() {
      var filepath = $('input.filepath').val();
      var filename = _.extractFilename(filepath)[1];
      var filecontent = this.serialize();
      var defaultMessage = 'Updated ' + filename;
      var message = $('.commit-message').val() || defaultMessage;
      var method = this.model.writeable ? this.saveFile : this.sendPatch;
      this.hideDiff();

      // Update content
      this.model.content = this.editor.getValue();

      // Delegate
      method.call(this, filepath, filename, filecontent, message);
    },

    keyMap: function() {
      var that = this;

      if (this.model.markdown) {
        return {
          'Ctrl-S': function(codemirror) {
            that.updateFile();
          },
          'Cmd-B': function(codemirror) {
            if (that.editor.getSelection !== '') that.bold();
          },
          'Ctrl-B': function(codemirror) {
            if (that.editor.getSelection !== '') that.bold();
          },
          'Cmd-I': function(codemirror) {
            if (that.editor.getSelection !== '') that.italic();
          },
          'Ctrl-I': function(codemirror) {
            if (that.editor.getSelection !== '') that.italic();
          }
        };
      } else {
        return {
          'Ctrl-S': function (codemirror) {
            that.updateFile();
          }
        };
      }
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
      var that = this;
      var $metadataEditor = $('#meta', this.el).find('.form');
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
          var value = $(item).val();

          switch(item.type) {
            case 'select-multiple':
            case 'select-one':
            case 'text':
              if (value) {
                if (metadata.hasOwnProperty(item.name)) {
                  metadata[item.name] = _.union(metadata[item.name], value);
                } else {
                  metadata[item.name] = value;
                }
              }
              break;
            case 'checkbox':
              if (item.checked) {

                if (metadata.hasOwnProperty(item.name)) {
                  metadata[item.name] = _.union(metadata[item.name], item.value);
                } else if (item.value === item.name) {
                  metadata[item.name] = item.checked
                } else {
                  metadata[item.name] = item.value;
                }

              } else if (!metadata.hasOwnProperty(item.name) && item.value === item.name) {
                metadata[item.name] = item.checked;
              } else {
                metadata[item.name] = item.checked;
              }
              break;
          }
        });

        if (that.rawEditor) {
          try {
            metadata = $.extend(metadata, jsyaml.load(that.rawEditor.getValue()));
          } catch(err) {
            console.log(err);
          }
        }

        return metadata;
      }

      function getRaw() {
        return jsyaml.dump(getValue());
      }

      function setValue(data) {
        var missing = {};
        var raw;

        _(data).each(function(value, key) {
          var matched = false;
          var input = $metadataEditor.find('[name="' + key + '"]');
          var length = input.length;
          var options;
          var tmpl;

          if (length) {

            // iterate over matching fields
            for (var i = 0; i < length; i++) {

              // if value is an array
              if (value !== null && typeof value === 'object' && value.length) {

                // iterate over values in array
                for (var j = 0; j < value.length; j++) {
                  switch(input[i].type) {
                    case 'select-multiple':
                    case 'select-one':
                      options = $(input[i]).find('option[value="' + value[j] + '"]');
                      if (options.length) {
                        for (var k = 0; k < options.length; k++) {
                          options[k].selected = 'selected';
                        }

                        matched = true;
                      }
                      break;
                    case 'text':
                      input[i].value = value;
                      matched = true;
                      break;
                    case 'checkbox':
                      if (input[i].value === value) {
                        input[i].checked = 'checked';
                        matched = true;
                      }
                      break;
                  }
                }

              } else {

                switch(input[i].type) {
                  case 'select-multiple':
                  case 'select-one':
                    options = $(input[i]).find('option[value="' + value + '"]');
                    if (options.length) {
                      for (var m = 0; m < options.length; m++) {
                        options[m].selected = 'selected';
                      }

                      matched = true;
                    }
                    break;
                  case 'text':
                    input[i].value = value;
                    matched = true;
                    break;
                  case 'checkbox':
                    input[i].checked = value ? 'checked' : false;
                    matched = true;
                    break;
                }

              }
            }

            if (!matched && value !== null) {
              if (missing.hasOwnProperty(key)) {
                missing[key] = _.union(missing[key], value);
              } else {
                missing[key] = value;
              }
            }

          } else {
            raw = {};
            raw[key] = value;

            if (that.rawEditor) {
              that.rawEditor.setValue(that.rawEditor.getValue() + jsyaml.dump(raw));
            } else {
              $('<div class="form-item"><div name="raw" id="raw"></div></div>')
                .prepend('<label for="raw">Raw Metadata</label>')
                .appendTo($metadataEditor);

              that.rawEditor = CodeMirror(
                $('#raw')[0], {
                  mode: 'yaml',
                  value: jsyaml.dump(raw),
                  lineWrapping: true,
                  extraKeys: that.keyMap(),
                  theme: 'prose-bright',
                  onChange: _.bind(that.makeDirty, that)
              });
            }
          }
        });

        _.each(missing, function(value, key) {
          if (value === null) return;

          switch(typeof value) {
            case 'boolean':
              tmpl = _(window.app.templates.checkbox).template();
              $metadataEditor.append(tmpl({
                name: key,
                label: value,
                value: value,
                checked: value ? 'checked' : false
              }));
              break;
            case 'string':
              tmpl = _(window.app.templates.text).template();
              $metadataEditor.append(tmpl({
                name: key,
                label: value,
                value: value
              }));
              break;
            case 'object':
              tmpl = _(window.app.templates.multiselect).template();
              $metadataEditor.append(tmpl({
                name: key,
                label: key,
                placeholder: key,
                options: value,
                lang: data.lang || 'en'
              }));
              break;
            default:
              console.log('ERROR could not create metadata field for ' + typeof value, key + ': ' + value);
              break;
          }
        });
      }

      function setRaw(data) {
        try {
          setValue(jsyaml.load(data));
        } catch(err) {
          console.log('ERROR encoding YAML');
          // No-op
        }
      }

      initialize(this.model);

      return {
        el: $metadataEditor,
        getRaw: getRaw,
        setRaw: setRaw,
        getValue: getValue,
        setValue: setValue
      };
    },

    initEditor: function() {
      var that = this;

      // TODO Remove setTimeout
      setTimeout(function () {
        if (that.model.jekyll) {
          that.metadataEditor = that.buildMeta();
          $('#post .metadata').hide();
        }

        that.editor = CodeMirror($('#code')[0], {
          mode: that.model.lang,
          value: that.model.content,
          lineWrapping: true,
          extraKeys: that.keyMap(),
          matchBrackets: true,
          theme: 'prose-bright'
        });

        that.editor.on('change', _.bind(that.makeDirty, that));
        that.refreshCodeMirror();

        // Check localStorage for existing stash
        // Apply if stash exists and is current, remove if expired
        that.stashApply();
      }, 100);
    },

    markdownSnippet: function(e) {
      var key = $(e.target, this.el).data('key');
      var snippet = $(e.target, this.el).data('snippet');

      if (this.editor.getSelection !== '') {
        switch(key) {
          case 'bold':
            this.bold();
          break;
          case 'italic':
            this.italic();
          break;
          case 'heading':
            this.heading();
          break;
          case 'sub-heading':
            this.subHeading();
          break;
          default:
            this.editor.replaceSelection(snippet);
          break;
        }
        this.editor.focus();
      } else {
        this.editor.replaceSelection(snippet);
        this.editor.focus();
      }

      return false;
    },

    heading: function() {
      this.editor.replaceSelection('# ' + this.editor.getSelection().replace(/#/g, ''));
    },

    subHeading: function() {
      this.editor.replaceSelection('## ' + this.editor.getSelection().replace(/#/g, ''));
    },

    italic: function() {
      this.editor.replaceSelection('_' + this.editor.getSelection().replace(/_/g, '') + '_');
    },

    bold: function() {
      this.editor.replaceSelection('**' + this.editor.getSelection().replace(/\*/g, '') + '**');
    },

    remove: function () {
      // Unbind pagehide event handler when View is removed
      this.eventRegister.unbind('edit', this.postViews);
      this.eventRegister.unbind('preview', this.preview);
      this.eventRegister.unbind('deleteFile', this.deleteFile);
      this.eventRegister.unbind('save', this.save);
      this.eventRegister.unbind('hideDiff', this.hideDiff);
      this.eventRegister.unbind('translate', this.translate);
      this.eventRegister.unbind('updateFile', this.updateFile);
      this.eventRegister.unbind('meta', this.updateFile);

      // Unbind Keybindings
      key.unbind('⌘+s, ctrl+s', 'file');

      $(window).unbind('pagehide');
      Backbone.View.prototype.remove.call(this);
    }
});
