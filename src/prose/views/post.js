var $ = require('jquery-browserify');
var chosen = require('chosen-jquery-browserify');
var _ = require('underscore');
var jsyaml = require('js-yaml');
var key = require('keymaster');
var marked = require('marked');
var diff = require('diff');
var Backbone = require('backbone');
var utils = require('.././util');
var queue = require('queue-async');

module.exports = Backbone.View.extend({

  id: 'post',
  className: 'post',

  events: {
    'click .markdown-snippets a': 'markdownSnippet',
    'click .save-action': 'updateFile',
    'click button': 'toggleButton',
    'click .unpublished-flag': 'meta',
    'change input': 'makeDirty'
  },

  initialize: function() {
    this.prevFile = this.serialize();

    // Stash editor and metadataEditor content to sessionStorage on pagehide event
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

    this.eventRegister.trigger('sidebarContext', this.data);
    this.renderHeading();

    var tmpl = _(window.app.templates.post).template();

    $(this.el).empty().append(tmpl(_.extend(this.model, {
      mode: app.state.mode,
      metadata: this.model.metadata,
      avatar: this.header.avatar
    })));

    if (this.model.markdown && app.state.mode === 'blob') {
      this.preview();
    } else {
      // Editor is first up so trigger an active class for it
      $('#edit', this.el).toggleClass('active', true);
      $('.post-views .edit').addClass('active');

      this.initEditor();
      _.delay(function() {
        utils.fixedScroll($('.topbar', view.el));
      }, 1);
    }

    this.updateDocumentTitle();

    // Prevent exit when there are unsaved changes
    window.onbeforeunload = function() {
      if (app.state.file && view.dirty) return 'You have unsaved changes. Are you sure you want to leave?';
    };

    return this;
  },

  updateDocumentTitle: function() {
    var context = 'Editing ';
    var pathTitle = (app.state.path) ? app.state.path : '';

    if (app.state.mode === 'blob') context = 'Previewing ';
    this.eventRegister.trigger('documentTitle', context + pathTitle + '/' + app.state.file + ' at ' + app.state.branch);
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
      writeable: this.model.writeable,
      alterable: true
    };

    this.eventRegister.trigger('headerContext', this.header);
  },

  edit: function(e) {
    var view = this;
    // If preview was hit on load this.editor
    // was not initialized.
    if (!this.editor) {
      this.initEditor();
      _.delay(function() {
        utils.fixedScroll($('.topbar', view.el));
      }, 1);
    }

    app.state.mode = 'edit';
    this.updateURL();

    $('.post-views a').removeClass('active');
    $('.post-views .edit').addClass('active');
    $('#prose').toggleClass('open', false);

    $('.views .view', this.el).removeClass('active');
    $('#edit', this.el).addClass('active');

    return false;
  },

  preview: function(e) {
    $('#prose').toggleClass('open', false);
    if (app.state.config && app.state.config.prose && app.state.config.prose.siteurl && this.model.metadata && this.model.metadata.layout) {
      var hash = window.location.hash.split('/');
      hash[2] = 'preview';
      if (!_(hash).last().match(/^\d{4}-\d{2}-\d{2}-(?:.+)/)) {
        hash.push(_($('input.filepath').val().split('/')).last());
      }
      this.stashFile();

      $(e.currentTarget).attr({
        target: '_blank',
        href: hash.join('/')
      });
      return true;
    } else {
      if (e) e.preventDefault();
      // Vertical Nav
      $('.post-views a').removeClass('active');
      $('.post-views .preview').addClass('active');

      // Content Window
      $('.views .view', this.el).removeClass('active');
      $('#preview', this.el).addClass('active').html(marked(this.model.content));

      app.state.mode = 'blob';
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
    return false;
  },

  deleteFile: function() {
    if (confirm('Are you sure you want to delete this file?')) {
      window.app.models.deletePost(app.state.user, app.state.repo, app.state.branch, this.model.path, this.model.file, _.bind(function(err) {
        if (err) return alert('Error during deletion. Please wait 30 seconds and try again.');
        router.navigate([app.state.user, app.state.repo, 'tree', app.state.branch].join('/'), true);
      }, this));
    }
    return false;
  },

  updateURL: function() {
    var url = _.compact([app.state.user, app.state.repo, app.state.mode, app.state.branch, this.model.path, this.model.file]);
    this.updateDocumentTitle();
    router.navigate(url.join('/'), {
      trigger: false,
      replace: true
    });
  },

  makeDirty: function(e) {
    this.dirty = true;
    if (this.editor) this.model.content = this.editor.getValue();
    if (this.metadataEditor) this.model.metadata = this.metadataEditor.getValue();

    var label = this.model.writeable ? 'Save' : 'Submit Change';
    this.eventRegister.trigger('updateSaveState', label, 'save');

    // Pass a popover span to the avatar icon
    $('.save-action', this.el).find('.popup').html(this.model.alterable ? 'Ctrl&nbsp;+&nbsp;S' : 'Submit Change');
  },

  toggleButton: function(e) {
    // Check whether this.model.metadata.published exists
    // if it does unpublish and vice versa
    var $target = $(e.target);
    var value = $target.val();

    if (value === 'true') {
      $target.val(false).html($target.data('off'));
    } else if (value === 'false') {
      $target.val(true).html($target.data('on'));
    }

    this.makeDirty();
    return false;
  },

  showDiff: function() {
    var $diff = $('#diff', this.el);
    var text1 = this.model.persisted ? _.escape(this.prevFile) : '';
    var text2 = _.escape(this.serialize());
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
    if (app.state.mode === 'blob') {
      $('#preview', this.el).addClass('active');
    } else {
      $('#edit', this.el).addClass('active');
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
      window.app.models.movePost(app.state.user, app.state.repo, app.state.branch, _.filepath(this.model.path, this.model.file), filepath, _.bind(function(err) {
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

        app.models.patchFile(app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, function(err) {

          if (err) {
            view.eventRegister.trigger('updateSaveState', '!&nbsp;Try&nbsp;again&nbsp;in 30&nbsp;seconds', 'error');
            return;
          }

          view.dirty = false;
          view.model.persisted = true;
          view.model.file = filename;
          view.updateURL();
          view.prevFile = filecontent;
          view.eventRegister.trigger('updateSaveState', 'Request Submitted', 'saved');
        });
      } else {
        view.eventRegister.trigger('updateSaveState', 'Error Metadata not Found', 'error');
      }
    }

    view.eventRegister.trigger('updateSaveState', 'Submitting Request', 'saving');
    patch();

    return false;
  },

  saveFile: function(filepath, filename, filecontent, message) {
    var view = this;

    function save() {
      if (view.updateMetaData()) {
        window.app.models.saveFile(app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, function(err) {
          if (err) {
            view.eventRegister.trigger('updateSaveState', '!&nbsp;Try&nbsp;again&nbsp;in 30&nbsp;seconds', 'error');
            return;
          }
          this.dirty = false;
          view.model.persisted = true;
          view.model.file = filename;
          view.updateURL();
          view.prevFile = filecontent;
          view.eventRegister.trigger('updateSaveState', 'Saved', 'saved', true);
        });
      } else {
        view.eventRegister.trigger('updateSaveState', '!Metadata', 'error');
      }
    }

    view.eventRegister.trigger('updateSaveState', 'Saving', 'saving');

    if (filepath === _.filepath(this.model.path, this.model.file)) return save();

    // Move or create file
    this.updateFilename(filepath, function(err) {
      if (err) {
        view.eventRegister.trigger('updateSaveState', '! Filename', 'error');
      } else {
        save();
      }
    });
  },

  stashFile: function(e) {
    if (e) e.preventDefault();
    if (!window.sessionStorage) return false;

    var store = window.sessionStorage;
    var filepath = $('input.filepath').val();

    // Don't stash if filepath is undefined
    if (filepath) {
      try {
        store.setItem(filepath, JSON.stringify({
          sha: app.state.sha,
          content: this.editor ? this.editor.getValue() : null,
          metadata: this.model.jekyll && this.metadataEditor ? this.metadataEditor.getValue() : null
        }));
      } catch (err) {
        console.log(err);
      }
    }
  },

  stashApply: function() {
    if (!window.sessionStorage) return false;

    var store = window.sessionStorage;
    var filepath = $('input.filepath').val();
    var item = store.getItem(filepath);
    var stash = JSON.parse(item);

    if (stash && stash.sha === window.app.state.sha) {
      // Restore from stash if file sha hasn't changed
      if (this.editor) this.editor.setValue(stash.content);
      if (this.metadataEditor) {
        this.rawEditor.setValue('');
        this.metadataEditor.setValue(stash.metadata);
      }
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
    if (app.state.mode === 'new') defaultMessage = 'Created ' + filename;
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
          if (view.editor.getSelection() !== '') view.bold(view.editor.getSelection());
        },
        'Ctrl-B': function(codemirror) {
          if (view.editor.getSelection() !== '') view.bold(view.editor.getSelection());
        },
        'Cmd-I': function(codemirror) {
          if (view.editor.getSelection() !== '') view.italic(view.editor.getSelection());
        },
        'Ctrl-I': function(codemirror) {
          if (view.editor.getSelection() !== '') view.italic(view.editor.getSelection());
        }
      };
    } else {
      return {
        'Ctrl-S': function(codemirror) {
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
        name: 'published',
        label: 'Publishing',
        value: model.metadata.published,
        on: 'Unpublish',
        off: 'Publish'
      }));

      function buildTemplate(data) {
        var tmpl;

        switch (data.field.element) {
          case 'button':
            tmpl = _(window.app.templates.button).template();
            $metadataEditor.append(tmpl({
              name: data.name,
              label: data.field.label,
              value: data.field.value,
              on: data.field.on,
              off: data.field.off
            }));
            break;
          case 'checkbox':
            tmpl = _(window.app.templates.checkbox).template();
            $metadataEditor.append(tmpl({
              name: data.name,
              label: data.field.label,
              value: data.name,
              checked: data.field.value
            }));
            break;
          case 'text':
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
      }

      function parseData(data, key) {
        if (_.isObject(data) && _.isObject(data.field)) {
          buildTemplate(data);
        } else if (_.isObject(data) && _.isArray(data.fields)) {
          _.each(data.fields, parseData);
        } else if (typeof data === 'string') {
          tmpl = _(window.app.templates.text).template();
          $metadataEditor.append(tmpl({
            name: key,
            label: key,
            value: data
          }));
        }
      }

      // iterate over default metadata
      _.each(model.default_metadata, parseData);

      $('<div class="form-item"><div name="raw" id="raw" class="inner"></div></div>').prepend('<label for="raw">Raw Metadata</label>').appendTo($metadataEditor);

      view.rawEditor = CodeMirror(document.getElementById('raw'), {
        mode: 'yaml',
        value: '',
        lineWrapping: true,
        extraKeys: view.keyMap(),
        theme: 'prose-bright'
      });

      view.rawEditor.on('change', _.bind(view.makeDirty, view));

      setValue(model.metadata);
      $('.chzn-select').chosen();
    }

    function getValue() {
      var metadata = {};

      _.each($metadataEditor.find('[name]'), function(item) {
        var value = $(item).val();

        switch (item.type) {
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
        case 'button':
          if (value === 'true') {
            metadata[item.name] = true;
          } else if (value === 'false') {
            metadata[item.name] = false;
          }
          break;
        }
      });

      if (view.rawEditor) {
        try {
          metadata = $.extend(metadata, jsyaml.load(view.rawEditor.getValue()));
        } catch (err) {
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

      function matchValue(value, input) {
        var q = queue();
        var matched = false;
        var options;

        if (_.isArray(value)) {

          // iterate over values in array
          for (var j = 0; j < value.length; j++) {
            switch (input.type) {
              case 'select-multiple':
              case 'select-one':
                options = $(input).find('option[value="' + value[j] + '"]');
                if (options.length) {
                  for (var k = 0; k < options.length; k++) {
                    options[k].selected = 'selected';
                  }

                  matched = true;
                }
                break;
              case 'text':
                input.value = value;
                matched = true;
                break;
              case 'checkbox':
                if (input.value === value) {
                  input.checked = 'checked';
                  matched = true;
                }
                break;
            }
          }

        } else if (_.isObject(value)) {

          _.each(value, function(value, key) {
            q.defer(parseValue, value, input.find('[name="' + key + '"]'));
          });

        } else {

          switch (input.type) {
            case 'select-multiple':
            case 'select-one':
              options = $(input).find('option[value="' + value + '"]');
              if (options.length) {
                for (var m = 0; m < options.length; m++) {
                  options[m].selected = 'selected';
                }

                matched = true;
              }
              break;
            case 'text':
              input.value = value;
              matched = true;
              break;
            case 'checkbox':
              input.checked = value ? 'checked' : false;
              matched = true;
              break;
            case 'button':
              input.value = value ? true : false;
              input.innerHTML = value ? input.getAttribute('data-on') : input.getAttribute('data-off');
              matched = true;
              break;
          }

          q.awaitAll(function(err, res) {
            if (err) console.log(err);
          });

        }
      }

      _(data).each(function(value, key) {
        var input = $metadataEditor.find('[name="' + key + '"]');
        var length = input.length;
        var q = queue();

        if (length) {

          // iterate over matching fields
          for (var i = 0; i < length; i++) {
            q.defer(matchValue, value, input[i]);
          }

          q.awaitAll(function(err, res) {
            if (res.indexOf(true) === -1 && value !== null) {
              if (missing.hasOwnProperty(key)) {
                missing[key] = _.union(missing[key], value);
              } else {
                missing[key] = value;
              }
            }
          });

        } else {
          raw = {};
          raw[key] = value;

          if (view.rawEditor) {
            view.rawEditor.setValue(view.rawEditor.getValue() + jsyaml.dump(raw));
          }
        }
      });

      _.each(missing, function(value, key) {
        var tmpl;

        if (value === null) return;

        switch (typeof value) {
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
      } catch (err) {
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
      }

      var lang = view.model.lang;
      view.editor = CodeMirror(document.getElementById('code'), {
        mode: view.model.lang,
        value: view.model.content,
        lineWrapping: true,
        lineNumbers: (lang === 'gfm' || lang === null) ? false : true,
        extraKeys: view.keyMap(),
        matchBrackets: true,
        theme: 'prose-bright'
      });

      // Monitor the current selection and apply
      // an active class to any snippet links
      if (view.model.lang === 'gfm') {
        var $snippetLinks = $('.markdown-snippets a', view.el);
        view.editor.on('cursorActivity', _.bind(function() {

          var selection = _.trim(view.editor.getSelection());
          $snippetLinks.removeClass('active');

          var isNumber = parseInt(selection.charAt(0), 10);

          if (!isNumber) {
            switch (selection.charAt(0)) {
            case '#':
              if (selection.charAt(1) === '#' && selection.charAt(2) !== '#') { // Subheading Check
                $('[data-key="sub-heading"]').addClass('active');
              } else if (selection.charAt(1) !== '#') {
                $('[data-key="heading"]').addClass('active');
              }
              break;
            case '>':
              $('[data-key="quote"]').addClass('active');
              break;
            case '*':
              if (selection.charAt(selection.length - 1) === '*') {
                $('[data-key="bold"]').addClass('active');
              }
              break;
            case '_':
              if (selection.charAt(selection.length - 1) === '_') {
                $('[data-key="italic"]').addClass('active');
              }
              break;
            case '!':
              if (selection.charAt(1) === '[' && selection.charAt(selection.length - 1) === ')') {
                $('[data-key="image"]').addClass('active');
              }
              break;
            case '[':
              if (selection.charAt(selection.length - 1) === ')') {
                $('[data-key="link"]').addClass('active');
              }
              break;
            case '-':
              if (selection.charAt(1) === ' ') {
                $('[data-key="list"]').addClass('active');
              }
              break;
            }
          } else {

            if (selection.charAt(1) === '.' && selection.charAt(2) === ' ') {
              $('[data-key="numbered-list"]').addClass('active');
            }
          }
        }, view));
      }

      view.editor.on('change', _.bind(view.makeDirty, view));
      view.refreshCodeMirror();

      // Check sessionStorage for existing stash
      // Apply if stash exists and is current, remove if expired
      view.stashApply();
    }, 100);
  },

  markdownSnippet: function(e) {
    var key = $(e.target, this.el).data('key');
    var snippet = $(e.target, this.el).data('snippet');
    var selection = _.trim(this.editor.getSelection());

    if (this.editor.getSelection !== '') {
      switch (key) {
      case 'bold':
        this.bold(selection);
        break;
      case 'italic':
        this.italic(selection);
        break;
      case 'heading':
        this.heading(selection);
        break;
      case 'sub-heading':
        this.subHeading(selection);
        break;
      case 'quote':
        this.quote(selection);
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

  heading: function(s) {
    if (s.charAt(0) === '#' && s.charAt(1) !== '#') {
      this.editor.replaceSelection(_.lTrim(s.replace(/#/g, '')));
    } else {
      this.editor.replaceSelection('# ' + s.replace(/#/g, ''));
    }
  },

  subHeading: function(s) {
    if (s.charAt(0) === '#' && s.charAt(2) !== '#') {
      this.editor.replaceSelection(_.lTrim(s.replace(/#/g, '')));
    } else {
      this.editor.replaceSelection('## ' + s.replace(/#/g, ''));
    }
  },

  italic: function(s) {
    if (s.charAt(0) === '_' && s.charAt(s.length - 1 === '_')) {
      this.editor.replaceSelection(s.replace(/_/g, ''));
    } else {
      this.editor.replaceSelection('_' + s.replace(/_/g, '') + '_');
    }
  },

  bold: function(s) {
    if (s.charAt(0) === '*' && s.charAt(s.length - 1 === '*')) {
      this.editor.replaceSelection(s.replace(/\*/g, ''));
    } else {
      this.editor.replaceSelection('**' + s.replace(/\*/g, '') + '**');
    }
  },

  quote: function(s) {
    if (s.charAt(0) === '>') {
      this.editor.replaceSelection(_.lTrim(s.replace(/\>/g, '')));
    } else {
      this.editor.replaceSelection('> ' + s.replace(/\>/g, ''));
    }
  },

  remove: function() {
    this.stashFile();

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

    $(window).off('pagehide');
    Backbone.View.prototype.remove.call(this);
  }
});
