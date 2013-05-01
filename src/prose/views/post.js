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
    className: 'post',

    events: {
      'click .markdown-snippets a': 'markdownSnippet',
      'click .save-action': 'updateFile',
      'change input': 'makeDirty'
    },

    initialize: function() {
      this.prevFile = this.serialize();

      // Stash editor and metadataEditor content to localStorage on pagehide event
      // Always run stashFile in context of view
      $(window).on('pagehide', _.bind(this.stashFile, this));
    },

    render: function() {
      var view = this;

      this.data = _.extend(this.model, {
        mode: app.state.mode,
        preview: this.model.markdown ? marked(this.model.content) : '',
        metadata: this.model.metadata
      });

      // Key Binding support.
      key('ctrl+s', 'file', _.bind(function() {
        this.updateFile();
        return false;
      }, this));

      // Attach Keybindings to the current scope
      key.setScope('file');

      this.eventRegister = app.eventRegister;

      // Listen for button clicks from the vertical nav
       _.bindAll(this, 'edit', 'preview', 'deleteFile', 'save', 'hideDiff', 'translate', 'updateFile', 'meta', 'remove');
      this.eventRegister.bind('edit', this.edit);
      this.eventRegister.bind('preview', this.preview);
      this.eventRegister.bind('deleteFile', this.deleteFile);
      this.eventRegister.bind('save', this.save);
      this.eventRegister.bind('hideDiff', this.hideDiff);
      this.eventRegister.bind('updateFile', this.updateFile);
      this.eventRegister.bind('translate', this.translate);
      this.eventRegister.bind('meta', this.meta);
      this.eventRegister.bind('remove', this.remove);

      // Ping `views/app.js` to let know we should swap out the sidebar
      this.eventRegister.trigger('sidebarContext', this.data, 'post');
      this.renderHeading();

      var tmpl = _(window.app.templates.post).template();

      $(this.el)
        .empty()
        .append(tmpl(_.extend(this.model, {
          mode: app.state.mode,
          metadata: this.model.metadata,
          avatar: this.header.avatar
        })));

      // Editor is first up so trigger an active class for it
      $('.post-views .edit').toggleClass('active', true);

      if (this.model.markdown && app.state.mode === 'blob') {
        this.preview();
      } else {
        this.initEditor();
        if (this.model.markdown) {
          _.delay(function () {
            utils.fixedScroll($('.topbar'));
          }, 1);
        }
      }

      return this;
    },

    renderHeading: function() {
      // Render heading
      var isPrivate = app.state.isPrivate ? true : false;
      var parentTrail = '<a href="#' + app.state.user + '">' + app.state.user + '</a> / <a href="#' + app.state.user + '/' + app.state.repo + '">' + app.state.repo + '</a>';

      this.header = {
        avatar: '<span class="ico round document ' + this.data.lang + '"></span>',
        parentTrail: parentTrail,
        isPrivate: isPrivate,
        title: _.filepath(this.data.path, this.data.file),
        alterable: true
      };

      this.eventRegister.trigger('headerContext', this.header);
    },

    edit: function(e) {
      // If preview was hit on load this.editor
      // was not initialized.
      if (!this.editor) {
        this.initEditor();
        if (this.model.markdown) {
          _.delay(function () {
            utils.fixedScroll($('.topbar'));
          }, 1);
        }
      }

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
      if (confirm('Are you sure you want to delete this file?')) {
        window.app.models.deletePost(app.state.user, app.state.repo, app.state.branch, this.model.path, this.model.file, _.bind(function (err) {
          if (err) return alert('Error during deletion. Please wait 30 seconds and try again.');
          router.navigate([app.state.user, app.state.repo, 'tree', app.state.branch].join('/'), true);
        }, this));
      }
      return false;
    },

    updateURL: function() {
      var url = _.compact([app.state.user, app.state.repo, app.state.mode, app.state.branch, this.model.path, this.model.file]);
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

      // Pass a popover span to the avatar icon
      $('.save-action', this.el).find('.popup').html('Ctrl&nbsp;+&nbsp;S');
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
      return true;
    },

    updateFilename: function(filepath, cb) {
      var view = this;

      if (!_.validPathname(filepath)) return cb('error');
      app.state.path = this.model.path; // ?
      app.state.file = _.extractFilename(filepath)[1];
      app.state.path = _.extractFilename(filepath)[0];

      function finish() {
        view.model.path = app.state.path;
        view.model.file = app.state.file;
        // re-render header to reflect the filename change
        view.renderHeading();
        view.updateURL();
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

      var view = this;

      function patch() {
        if (view.updateMetaData()) {
          view.model.content = view.prevFile;
          view.editor.setValue(view.prevFile);

          window.app.models.patchFile(app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, function (err) {
            if (err) {
              _.delay(function () {
                view.eventRegister.trigger('updateSaveState', 'Submit Change', '');
              }, 3000);

              view.eventRegister.trigger('updateSaveState', '! Try again in 30&nbsp;seconds', 'error');
              return;
            }

            view.dirty = false;
            view.model.persisted = true;
            view.model.file = filename;
            view.updateURL();
            view.prevFile = filecontent;
            view.eventRegister.trigger('Change Submitted', 'saved');
          });
        } else {
          view.eventRegister.trigger('! Metadata', 'error');
        }
      }

      view.eventRegister.trigger('updateSaveState', 'Submitting Change', 'saving');
      patch();

      return false;
    },

    saveFile: function(filepath, filename, filecontent, message) {
      var view = this;

      function save() {
        if (view.updateMetaData()) {
          window.app.models.saveFile(app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, function (err) {
            if (err) {
              view.eventRegister.trigger('updateSaveState', '! Try again in 30 seconds', 'error');
              return;
            }
            view.dirty = false;
            view.model.persisted = true;
            view.model.file = filename;
            view.updateURL();
            view.prevFile = filecontent;
            view.eventRegister.trigger('updateSaveState', 'Saved', 'saved');
          });
        } else {
          view.eventRegister.trigger('updateSaveState', '! Metadata', 'error');
        }
      }

      view.eventRegister.trigger('updateSaveState', 'Saving', 'saving');

      if (filepath === _.filepath(this.model.path, this.model.file)) return save();

      // Move or create file
      this.updateFilename(filepath, function (err) {
        if (err) {
          view.eventRegister.trigger('updateSaveState', '! Filename', 'error');
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
      return false;
    },

    keyMap: function() {
      var view = this;

      if (this.model.markdown) {
        return {
          'Ctrl-S': function(codemirror) {
            view.updateFile();
          },
          'Cmd-B': function(codemirror) {
            if (view.editor.getSelection !== '') view.bold();
          },
          'Ctrl-B': function(codemirror) {
            if (view.editor.getSelection !== '') view.bold();
          },
          'Cmd-I': function(codemirror) {
            if (view.editor.getSelection !== '') view.italic();
          },
          'Ctrl-I': function(codemirror) {
            if (view.editor.getSelection !== '') view.italic();
          }
        };
      } else {
        return {
          'Ctrl-S': function (codemirror) {
            view.updateFile();
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
      var view = this;
      var $metadataEditor = $('#meta', this.el).find('.form');
      $metadataEditor.empty();

      function initialize(model) {
        var tmpl;
        tmpl = _(window.app.templates.button).template();
        $metadataEditor.append(tmpl({
          label: model.published ? 'Unpublish' : 'Publish',
          value: model.published ? 'unpublish' : 'publish'
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
                  metadata[item.name] = item.checked;
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

        if (view.rawEditor) {
          try {
            metadata = $.extend(metadata, jsyaml.load(view.rawEditor.getValue()));
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

            if (view.rawEditor) {
              view.rawEditor.setValue(view.rawEditor.getValue() + jsyaml.dump(raw));
            } else {
              $('<div class="form-item"><div name="raw" id="raw" class="inner"></div></div>')
                .prepend('<label for="raw">Raw Metadata</label>')
                .appendTo($metadataEditor);

              view.rawEditor = CodeMirror(
                $('#raw')[0], {
                  mode: 'yaml',
                  value: jsyaml.dump(raw),
                  lineWrapping: true,
                  extraKeys: view.keyMap(),
                  theme: 'prose-bright'
              });

              view.rawEditor.on('change', _.bind(view.makeDirty, view));
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
      var view = this;

      // TODO Remove setTimeout
      setTimeout(function() {
        if (view.model.jekyll) {
          view.metadataEditor = view.buildMeta();
          $('#post .metadata').hide();
        }

        var lang = view.model.lang;
        view.editor = CodeMirror($('#code')[0], {
          mode: view.model.lang,
          value: view.model.content,
          lineWrapping: true,
          lineNumbers: (lang === 'gfm' || lang === null) ? false : true,
          extraKeys: view.keyMap(),
          matchBrackets: true,
          theme: 'prose-bright'
        });

        view.editor.on('change', _.bind(view.makeDirty, view));
        view.refreshCodeMirror();

        // Check localStorage for existing stash
        // Apply if stash exists and is current, remove if expired
        view.stashApply();
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
          case 'quote':
            this.quote();
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

    quote: function() {
      this.editor.replaceSelection('> ' + this.editor.getSelection().replace(/\*/g, ''));
    },

    remove: function () {
      this.eventRegister.unbind('edit', this.postViews);
      this.eventRegister.unbind('preview', this.preview);
      this.eventRegister.unbind('deleteFile', this.deleteFile);
      this.eventRegister.unbind('save', this.save);
      this.eventRegister.unbind('hideDiff', this.hideDiff);
      this.eventRegister.unbind('translate', this.translate);
      this.eventRegister.unbind('updateFile', this.updateFile);
      this.eventRegister.unbind('meta', this.updateFile);
      this.eventRegister.unbind('remove', this.remove);

      // Clear any file state classes in #prose
      this.eventRegister.trigger('updateSaveState', '', '');

      // Unbind Keybindings
      key.unbind('ctrl+s', 'file');

      $(window).unbind('pagehide');
      Backbone.View.prototype.remove.call(this);
    }
});
