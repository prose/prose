var $ = require('jquery-browserify');
var chosen = require('chosen-jquery-browserify');
var _ = require('underscore');
_.merge = require('deepmerge');
var jsyaml = require('js-yaml');
var key = require('keymaster');
var marked = require('marked');
var diff = require('diff');
var Backbone = require('backbone');
var utils = require('.././util');
var upload = require('.././upload');
var cookie = require('.././cookie');
var toolbar = require('.././toolbar/markdown.js');

module.exports = Backbone.View.extend({

  id: 'post',
  className: 'post',

  events: {
    'click .group a': 'markdownSnippet',
    'click .dialog .insert': 'dialogInsert',
    'click .save-action': 'updateFile',
    'click .publish-flag': 'togglePublishing',
    'click .draft-to-post': 'draft',
    'click .meta .finish': 'backToMode',
    'change #upload': 'fileInput',
    'change .meta input': 'makeDirty'
  },

  initialize: function() {
    this.prevFile = this.serialize();
    this.config = {};
    this.recentlyUploadedFiles = [];

    if (app.state.config && app.state.config.prose) {
      this.config.siteurl = app.state.config.prose.siteurl || false;
      this.config.relativeLinks = app.state.config.prose.relativeLinks || false;
      this.config.media = app.state.config.prose.media || false;
    }

    this.newFile = (app.state.mode === 'new') ? true : false;

    // Stash editor and metadataEditor content to sessionStorage on pagehide event
    // Always run stashFile in context of view
    $(window).on('pagehide', _.bind(this.stashFile, this));
  },

  render: function() {
    var view = this;

    // Link Dialog
    if (app.state.markdown && this.config.relativeLinks) {
      $.ajax({
        cache: true,
        dataType: 'jsonp',
        jsonp: false,
        jsonpCallback: this.config.relativeLinks.split('?callback=')[1] || 'callback',
        url: this.config.relativeLinks,
        success: function(links) {
          view.relativeLinks = links;
        }
      });
    }

    // Assets Listing for the Media Dialog
    if (app.state.markdown && this.config.media) {
      this.assetsDirectory = this.config.media;
      app.models.loadPosts(app.state.user, app.state.repo, app.state.branch, this.config.media, function(err, data) {
        view.assets = data.files;
      });
    }

    this.data = _.extend(this.model, {
      mode: app.state.mode,
      preview: this.model.markdown ? marked(this.compilePreview(this.model.content)) : '',
      metadata: this.model.metadata
    });

    this.eventRegister = app.eventRegister;

    // Listen for button clicks from the vertical nav
    _.bindAll(this, 'edit', 'preview', 'deleteFile', 'showDiff', 'translate', 'draft', 'updateFile', 'meta', 'remove', 'cancel');
    this.eventRegister.bind('edit', this.edit);
    this.eventRegister.bind('preview', this.preview);
    this.eventRegister.bind('deleteFile', this.deleteFile);
    this.eventRegister.bind('showDiff', this.showDiff);
    this.eventRegister.bind('updateFile', this.updateFile);
    this.eventRegister.bind('translate', this.translate);
    this.eventRegister.bind('draft', this.draft);
    this.eventRegister.bind('meta', this.meta);
    this.eventRegister.bind('remove', this.remove);
    this.eventRegister.bind('cancel', this.cancel);

    var tmpl = _(window.app.templates.post).template();

    $(this.el).empty().append(tmpl(_.extend(this.model, {
      mode: app.state.mode
    })));

    this.renderHeading();
    this.renderToolbar();

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
      writable: this.model.writable,
      alterable: true,
      translate: this.data.translate,
      lang: this.data.lang,
      metadata: this.data.metadata
    };

    this.eventRegister.trigger('headerContext', this.header, true);
  },

  renderToolbar: function() {
    var tmpl = _(window.app.templates.toolbar).template();

    this.$el.find('#toolbar').empty().append(tmpl(_.extend(this.model, {
      metadata: this.model.metadata,
      avatar: this.model.lang,
      draft: (this.model.path.split('/')[0] === '_drafts') ? true : false
    })));
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

    app.state.mode = this.newFile ? 'new' : 'edit';
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
    if (this.config.siteurl && this.model.metadata && this.model.metadata.layout) {
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
      $('#preview', this.el).addClass('active').html(marked(this.compilePreview(this.model.content)));

      app.state.mode = 'blob';
      this.updateURL();
    }
  },

  compilePreview: function(content) {
    // Scan the content search for ![]()
    // grab the path and file and form a RAW github aboslute request for it
    var scan = /\!\[([^\[]*)\]\(([^\)]+)\)/g;
    var image = /\!\[([^\[]*)\]\(([^\)]+)\)/;
    var titleAttribute = /".*?"/;

    // Build an array of found images
    var result = content.match(scan);

    // Iterate over the results and replace
    _(result).each(function(r) {
        var parts = (image).exec(r);

        if (parts !== null) {
          var path = parts[2];

          if (!_.absolutePath(path)) {
            // Remove any title attribute in the image tag is there is one.
            if (titleAttribute.test(path)) {
              path = path.split(titleAttribute)[0];
            }

            var raw = auth.raw + '/' + app.state.user + '/' + app.state.repo + '/' + app.state.branch + '/' + path;
            if (app.state.isPrivate) {
              // append auth param
              raw += '?login=' + cookie.get('username') + '&token=' + cookie.get('oauth-token');
            }

            content = content.replace(r, '![' + parts[1] + '](' + raw + ')');
          }
        }
    });

    return content;
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

  backToMode: function() {
    if (app.state.mode === 'preview') {
      this.preview();
    } else {
      this.edit();
    }

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

    $('.chzn-select', this.el).trigger('liszt:updated');
  },

  makeDirty: function(e) {
    this.dirty = true;
    if (this.editor && this.editor.getValue) this.model.content = this.editor.getValue();
    if (this.metadataEditor) this.model.metadata = this.metadataEditor.getValue();

    var label = this.model.writable ? 'Unsaved Changes' : 'Submit Change';
    this.eventRegister.trigger('updateSaveState', label, 'save');

    // Pass a popover span to the avatar icon
    $('.save-action', this.el).find('.popup').html(this.model.alterable ? 'Save' : 'Submit Change');
  },

  togglePublishing: function(e) {
    var $target = $(e.target);

    if ($target.hasClass('published')) {
      $target
        .empty()
        .html('Unpublish<span class="ico checkmark"></span>')
        .removeClass('published')
        .attr('data-state', false);
    } else {
      $target
        .empty()
        .html('Publish<span class="ico checkmark"></span>')
        .addClass('published')
        .attr('data-state', true);
    }

    this.makeDirty();
    return false;
  },

  showDiff: function() {
    var $diff = this.$el.find('#diff');
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
    this.$el.find('.views .view').removeClass('active');
    $diff.addClass('active');
    $diff.find('.diff-content').empty().append('<pre>' + compare + '</pre>');
  },

  closeSettings: function() {
    $('.views .view', this.el).removeClass('active');

    if (app.state.mode === 'blob') {
      $('#preview', this.el).addClass('active');
    } else {
      $('#edit', this.el).addClass('active');
    }

    this.eventRegister.trigger('closeSettings');
  },

  cancel: function() {
    this.$el.find('.views .view').removeClass('active');
    this.$el.find('.' + app.state.mode).addClass('active');
  },

  refreshCodeMirror: function() {
    if (typeof this.editor.refresh === 'function') this.editor.refresh();
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
    var metadata = this.metadataEditor ? this.metadataEditor.getRaw() : jsyaml.dump(this.model.metadata).trim();

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
          view.closeSettings();
          view.updatePublishState();
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
          view.dirty = false;
          view.model.persisted = true;
          view.model.file = filename;

          if (app.state.mode === 'new') {
            app.state.mode = 'edit';
            view.eventRegister.trigger('renderNav');
          }

          view.renderHeading();
          view.updateURL();
          view.prevFile = filecontent;
          view.closeSettings();
          view.updatePublishState();
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
        view.eventRegister.trigger('filenameInput');
        view.eventRegister.trigger('updateSaveState', 'Needs&nbsp;a&nbsp;filename', 'error');
      } else {
        save();
      }
    });
  },

  saveDraft: function(filepath, filename, filecontent, message) {
    var view = this;
    view.eventRegister.trigger('updateSaveState', 'Saving', 'saving');
    window.app.models.saveFile(app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, function(err) {
      if (err) {
        view.eventRegister.trigger('updateSaveState', '!&nbsp;Try&nbsp;again&nbsp;in 30&nbsp;seconds', 'error');
        return;
      }
      view.dirty = false;
      view.model.persisted = true;
      view.model.file = filename;

      if (app.state.mode === 'new') app.state.mode = 'edit';
      view.renderHeading();
      view.updateURL();
      view.prevFile = filecontent;
      view.closeSettings();
      view.updatePublishState();
      view.eventRegister.trigger('updateSaveState', 'Saved', 'saved', true);
    });
  },

  updatePublishState: function() {
    // Update the publish key wording depening on what was saved
    var $publishKey = $('.publish-flag', this.el);
    var key = $publishKey.attr('data-state');

    if (key === 'true') {
      $publishKey.html('Published<span class="ico checkmark"></span>');
    } else {
      $publishKey.html('Unpublished<span class="ico checkmark"></span>');
    }
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
      if (this.editor && this.editor.setValue) this.editor.setValue(stash.content);
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
    var $message = $('.commit-message');
    var noVal = 'Updated ' + filename;
    if (app.state.mode === 'new') noVal = 'Created ' + filename;

    var message = $message.val() || noVal;
    var method = this.model.writable ? this.saveFile : this.sendPatch;

    // Update content
    this.model.content = (this.editor) ? this.editor.getValue() : '';

    // Delegate
    method.call(this, filepath, filename, filecontent, message);
    return false;
  },

  draft: function() {
    var filepath = _.extractFilename($('input.filepath').val());
    var basepath = filepath[0].split('/');
    var filename = filepath[1];
    var postType = basepath[0];
    var filecontent = this.serialize();
    var message = 'Created draft of ' + filename;

    if (postType === '_posts') {
      basepath.splice(0, 1, '_drafts');
      filepath.splice(0, 1, basepath.join('/'));
      this.saveDraft(filepath.join('/'), filename, filecontent, message);
      app.state.path = this.model.path = filepath[0];
    } else {
      basepath.splice(0, 1, '_posts');
      filepath.splice(0, 1, basepath.join('/'));
      message = 'Create post from draft of ' + filename;
      this.saveFile(filepath.join('/'), filename, filecontent, message);
      app.state.path = this.model.path = filepath[0];
    }

    this.renderToolbar();
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

    router.navigate(_(hash).compact().join('/') + '?lang=' + href + '&translate=true', true);

    return false;
  },

  buildMeta: function() {
    var view = this;
    var $metadataEditor = $('#meta', this.el).find('.form');
    $metadataEditor.empty();

    function initialize(model) {
      var tmpl;

      _(model.default_metadata).each(function(data, key) {
        if (data && typeof data.field === 'object') {
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
                value: data.field.value,
                type: 'text'
              }));
              break;
            case 'number':
              tmpl = _(window.app.templates.text).template();
              $metadataEditor.append(tmpl({
                name: data.name,
                label: data.field.label,
                value: data.field.value,
                type: 'number'
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
            case 'hidden':
              tmpl = {};
              tmpl[data.name] = data.field.value;
              view.model.metadata = _.merge(tmpl, view.model.metadata);
              break;
          }
        } else {
          tmpl = _(window.app.templates.text).template();
          $metadataEditor.append(tmpl({
            name: key,
            label: key,
            value: data,
            type: 'text'
          }));
        }
      });

      $('<div class="form-item"><div name="raw" id="raw" class="inner"></div></div>').prepend('<label for="raw">Raw Metadata</label>').appendTo($metadataEditor);

      var rawContainer = (view.model.lang === 'yaml') ? 'code' : 'raw';
      view.rawEditor = CodeMirror(document.getElementById(rawContainer), {
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

      if ($('.publish-flag').attr('data-state') === 'true') {
        metadata.published = true;
      } else {
        metadata.published = false;
      }

      _.each($metadataEditor.find('[name]'), function(item) {
        var $item = $(item);
        var value = $item.val();

        switch (item.type) {
          case 'select-multiple':
          case 'select-one':
          case 'text':
            if (value) {
              value = $item.data('type') === 'number' ? Number(value) : value;
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
          metadata = _.extend(metadata, jsyaml.load(view.rawEditor.getValue()));
        } catch (err) {
          console.log(err);
        }
      }

      return _.extend(view.model.metadata, metadata);
    }

    function getRaw() {
      return jsyaml.dump(getValue()).trim();
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
                switch (input[i].type) {
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
              switch (input[i].type) {
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
              case 'button':
                input[i].value = value ? true : false;
                input[i].innerHTML = value ? input[i].getAttribute('data-on') : input[i].getAttribute('data-off');
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
          // Don't render the 'publish?ed' field or hidden metadata
          var defaults = _.find(view.model.default_metadata, function(data) { return data.name === key; });
          var diff = defaults && _.isArray(value) ? _.difference(value, defaults.field.value) : value;

          if (key !== 'published' && !defaults) {
            raw = {};
            raw[key] = value;

            if (view.rawEditor) {
              view.rawEditor.setValue(view.rawEditor.getValue() + jsyaml.dump(raw));
            }
          }
        }
      });

      _.each(missing, function(value, key) {
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
            value: value,
            type: 'text'
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

  fileInput: function(e) {
    var view = this;
    upload.fileSelect(e, function(e, file, content) {
      view.updateImageInsert(e, file, content);
    });

    return false;
  },

  updateImageInsert: function(e, file, content) {
    var view = this;
    var path = (this.assetsDirectory) ? this.assetsDirectory : this.model.path;

    var src = path + '/' + encodeURIComponent(file.name);
    $('input[name="url"]').val(src);
    $('input[name="alt"]').val('');

    view.queue = {
      e: e,
      file: file,
      content: content
    };
  },

  initEditor: function() {
    var view = this;

    // TODO Remove setTimeout
    setTimeout(function() {
      if (view.model.jekyll) {
        view.metadataEditor = view.buildMeta();
      }

      // Don't set up content editor for yaml posts
      if (view.model.lang === 'yaml') return;

      var lang = view.model.lang;
      view.editor = CodeMirror(document.getElementById('code'), {
        mode: view.model.lang,
        value: view.model.content,
        lineWrapping: true,
        lineNumbers: (lang === 'gfm' || lang === null) ? false : true,
        extraKeys: view.keyMap(),
        matchBrackets: true,
        dragDrop: false,
        theme: 'prose-bright'
      });

      // Bind Drag and Drop work on the editor
      if (app.state.markdown && view.model.writable) {
        upload.dragDrop($('#edit'), function(e, file, content) {
          if ($('#dialog').hasClass('dialog')) {
            view.updateImageInsert(e, file, content);
          } else {
            view.createAndUpload(e, file, content);
          }
        });
      }

      // Monitor the current selection and apply
      // an active class to any snippet links
      if (view.model.lang === 'gfm') {
        var $snippetLinks = $('.toolbar .group a', view.el);
        view.editor.on('cursorActivity', _.bind(function() {

          var selection = _.trim(view.editor.getSelection());
          $snippetLinks.removeClass('active');

          var match = {
            lineBreak: /\n/,
            h1: /^#{1}/,
            h2: /^#{2,2}/,
            h3: /^#{3,3}/,
            strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
            italic: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
            isNumber: parseInt(selection.charAt(0), 10)
          };

          if (!match.isNumber) {
            switch (selection.charAt(0)) {
              case '#':
                if (!match.lineBreak.test(selection)) {
                  if (match.h2.test(selection) && !match.h3.test(selection)) {
                    $('[data-key="sub-heading"]').addClass('active');
                  } else if (!match.h2.test(selection)) {
                    $('[data-key="heading"]').addClass('active');
                  }
                }
                break;
              case '>':
                $('[data-key="quote"]').addClass('active');
                break;
              case '*':
              case '_':
                if (!match.lineBreak.test(selection)) {
                  if (match.strong.test(selection)) {
                    $('[data-key="bold"]').addClass('active');
                  } else if (match.italic.test(selection)) {
                    $('[data-key="italic"]').addClass('active');
                  }
                }
                break;
              case '!':
                if (!match.lineBreak.test(selection) &&
                    selection.charAt(1) === '[' &&
                    selection.charAt(selection.length - 1) === ')') {
                  $('[data-key="media"]').addClass('active');
                }
                break;
              case '[':
                if (!match.lineBreak.test(selection) &&
                    selection.charAt(selection.length - 1) === ')') {
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
      view.editor.on('focus', _.bind(function() {

        // If an upload queue is set, we want to clear it.
        this.queue = undefined;

        // If a dialog window is open and the editor is in focus, close it.
        $('.toolbar .group a', this.el).removeClass('on');
        $('#dialog', view.el).empty().removeClass();
      }, view));

      view.refreshCodeMirror();

      // Check sessionStorage for existing stash
      // Apply if stash exists and is current, remove if expired
      view.stashApply();
    }, 100);
  },

  createAndUpload: function(e, file, content, userDefinedPath) {
    var view = this;

    // Loading State
    this.eventRegister.trigger('updateSaveState', 'Uploading ' + file.name, 'saving');

    // Base64 Encode the file content
    var extension = file.type.split('/').pop();
    var path;

    if (userDefinedPath) {
      // Unique Filename
      path = userDefinedPath;
    } else {
      var uid = encodeURIComponent(file.name);
      path = this.assetsDirectory ?
             this.assetsDirectory + '/' + uid :
             (this.model.path) ?
               this.model.path + '/' + uid :
               uid;
    }

    var data = {};
        data.message = 'Uploaded ' + file.name;
        data.content = content;
        data.branch = app.state.branch;

    // Read through the filenames of path. If there is a filename that
    // exists, we want to pass data.sha to update the existing one.
    app.models.loadPosts(app.state.user, app.state.repo, app.state.branch, _.extractFilename(path)[0], function(err, res) {
      if (err) return view.eventRegister.trigger('updateSaveState', 'Error Uploading try again in 30 Seconds!', 'error');

      // Check whether the current (or media) directory
      // contains the same filename as the one a user wishes
      // to upload. we want to update the file by passing the sha
      // to the data object in this case.
      _(res.files).each(function(f) {
        var parts = _.extractFilename(f.path);
        var structuredPath = [parts[0], encodeURIComponent(parts[1])].join('/');
        if (structuredPath === path) {
          data.sha = f.sha;
        }
      });

      // Stored in memory to test as GitHub may have not
      // picked up on the change fast enough.
      _(view.recentlyUploadedFiles).each(function(f) {
        if (f.path === path) {
          data.sha = f.sha;
        }
      });

      app.models.uploadFile(app.state.user, app.state.repo, path, data, function(type, res) {
        if (type === 'error') {
          view.eventRegister.trigger('updateSaveState', 'Error&nbsp;Uploading try again in 30 Seconds!', 'error');
        } else {
          var $alt = $('input[name="alt"]');
          var image = ($alt.val() && $alt.val() !== undefined) ?
            '\n![' + $alt.val() + '](/' + path + ')' :
            '\n![' + file.name + '](/' + path + ')';

          view.editor.focus();
          view.editor.replaceSelection(image);
          view.eventRegister.trigger('updateSaveState', 'Saved', 'saved', true);

          // Update the media directory with the
          // newly uploaded image.
          if (!data.sha && view.assets) {
            view.assets.push({
              name: file.name,
              type: 'blob',
              path: path
            });
          }

          // Store a record of recently uploaded files in memory
          var fileParts = _.extractFilename(res.content.path);
          var structuredPath = [fileParts[0], encodeURIComponent(fileParts[1])].join('/');

          view.recentlyUploadedFiles.push({
            path: structuredPath,
            sha: res.content.sha
          });
        }
      });
    });
  },

  markdownSnippet: function(e) {
    var view = this;
    var $target = $(e.target, this.el).closest('a');
    var $dialog = $('#dialog', this.el);
    var $snippets = $('.toolbar .group a', this.el);
    var key = $target.data('key');
    var snippet = $target.data('snippet');
    var selection = _.trim(this.editor.getSelection());

    $dialog.removeClass().empty();

    if (snippet) {
      $snippets.removeClass('on');

      if (selection) {
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
    } else if ($target.data('dialog')) {

      var tmpl, className;
      if (key === 'media' && !this.assets) {
          className = key + ' no-directory';
      } else {
          className = key;
      }

      // This condition handles the link and media link in the toolbar.
      if ($target.hasClass('on')) {
        $target.removeClass('on');
        $dialog.removeClass().empty();
      } else {
        $snippets.removeClass('on');
        $target.addClass('on');
        $dialog
          .removeClass()
          .addClass('dialog ' + className)
          .empty();

        switch(key) {
          case 'link':
            tmpl = _(app.templates.linkDialog).template();

            $dialog.append(tmpl({
              relativeLinks: view.relativeLinks
            }));

            if (view.relativeLinks) {
              $('.chzn-select', $dialog).chosen().change(function() {
                $('.chzn-single span').text('Insert a local link.');

                var parts = $(this).val().split(',');
                $('input[name=href]', $dialog).val(parts[0]);
                $('input[name=text]', $dialog).val(parts[1]);
              });
            }

            if (selection) {
              // test if this is a markdown link: [text](link)
              var link = /\[([^\]]+)\]\(([^)]+)\)/;
              var quoted = /".*?"/;

              var text = selection;
              var href;
              var title;

              if (link.test(selection)) {
                var parts = link.exec(selection);
                text = parts[1];
                href = parts[2];

                // Search for a title attrbute within the url string
                if (quoted.test(parts[2])) {
                  href = parts[2].split(quoted)[0];

                  // TODO could be improved
                  title = parts[2].match(quoted)[0].replace(/"/g, '');
                }
              }

              $('input[name=text]', $dialog).val(text);
              if (href) $('input[name=href]', $dialog).val(href);
              if (title) $('input[name=title]', $dialog).val(title);
            }
          break;
          case 'media':
            tmpl = _(app.templates.mediaDialog).template();
            $dialog.append(tmpl({
              writable: view.data.writable,
              assetsDirectory: (view.assets) ? true : false
            }));

            if (view.assets) view.renderAssets(view.assets);

            if (selection) {
              var image = /\!\[([^\[]*)\]\(([^\)]+)\)/;
              var src;
              var alt;

              if (image.test(selection)) {
                var imageParts = image.exec(selection);
                alt = imageParts[1];
                src = imageParts[2];

                $('input[name=url]', $dialog).val(src);
                if (alt) $('input[name=alt]', $dialog).val(alt);
              }
            }
          break;
          case 'help':
            tmpl = _(app.templates.helpDialog).template();
            $dialog.append(tmpl({
              help: toolbar.help
            }));

            // Page through different help sections
            var $mainMenu = $('.main-menu a', this.el);
            var $subMenu = $('.sub-menu', this.el);
            var $content = $('.help-content', this.el);

            $mainMenu.on('click', function() {
              if (!$(this).hasClass('active')) {

                $mainMenu.removeClass('active');
                $content.removeClass('active');
                $subMenu
                    .removeClass('active')
                    .find('a')
                    .removeClass('active');

                $(this).addClass('active');

                // Add the relavent sub menu
                var parent = $(this).data('id');
                $('.' + parent).addClass('active');

                // Add an active class and populate the
                // content of the first list item.
                var $firstSubElement = $('.' + parent + ' a:first', this.el);
                $firstSubElement.addClass('active');

                var subParent = $firstSubElement.data('id');
                $('.help-' + subParent).addClass('active');
              }
              return false;
            });

            $subMenu.find('a').on('click', function() {
              if (!$(this).hasClass('active')) {

                $subMenu.find('a').removeClass('active');
                $content.removeClass('active');
                $(this).addClass('active');

                // Add the relavent content section
                var parent = $(this).data('id');
                $('.help-' + parent).addClass('active');
              }

              return false;
            });

          break;
        }
      }
    }

    return false;
  },

  renderAssets: function(data, back) {
    var view = this;
    var $media = $('#media', this.el);
    var tmpl = _(app.templates.asset).template();

    // Reset some stuff
    $('.directory a', $media).off('click', this.assetDirectory);
    $media.empty();

    if (back && (back.join() !== this.assetsDirectory)) {
      var link = back.slice(0, back.length - 1).join('/');
      $media.append('<li class="directory back"><a href="' + link + '"><span class="ico fl small inline back"></span>Back</a></li>');
    }

    _(data).each(function(asset) {
      var parts = asset.path.split('/');
      var path = parts.slice(0, parts.length - 1).join('/');

      $media.append(tmpl({
        name: asset.name,
        type: asset.type,
        path: path + '/' + encodeURIComponent(asset.name)
      }));
    });

    $('.asset a', $media).on('click', function(e) {
      var href = $(this).attr('href');
      var alt = _.trim($(this).text());

      if (_.isImage(href)) {
        $('input[name="url"]').val(href);
        $('input[name="alt"]').val(alt);
      } else {
        view.editor.replaceSelection(href);
        view.editor.focus();
      }
      return false;
    });

    $('.directory a', $media).on('click', function(e) {
      view.assetDirectory($(e.target), view);
      return false;
    });
  },

  assetDirectory: function(dir, view) {
    var path = dir.attr('href');
    app.models.loadPosts(app.state.user, app.state.repo, app.state.branch, path, function(err, data) {
      view.renderAssets(data.files, path.split('/'));
    });
  },

  dialogInsert: function(e) {
    var $dialog = $('#dialog', this.el);
    var $target = $(e.target, this.el);
    var type = $target.data('type');

    if (type === 'link') {
      var href = $('input[name="href"]').val();
      var text = $('input[name="text"]').val();
      var title = $('input[name="title"]').val();

      if (!text) text = href;

      if (title) {
        this.editor.replaceSelection('[' + text + '](' + href + ' "' + title + '")');
      } else {
        this.editor.replaceSelection('[' + text + '](' + href + ')');
      }

      this.editor.focus();
    }

    if (type === 'media') {
      if (this.queue) {
        var userDefinedPath = $('input[name="url"]').val();
        this.createAndUpload(this.queue.e, this.queue.file, this.queue.content, userDefinedPath);

        // Finally, clear the queue object
        this.queue = undefined;
      } else {
        var src = $('input[name="url"]').val();
        var alt = $('input[name="alt"]').val();
        this.editor.replaceSelection('\n![' + alt + '](/' + src + ')');
        this.editor.focus();
      }
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
    this.eventRegister.unbind('showDiff', this.showDiff);
    this.eventRegister.unbind('translate', this.translate);
    this.eventRegister.unbind('draft', this.draft);
    this.eventRegister.unbind('updateFile', this.updateFile);
    this.eventRegister.unbind('meta', this.updateFile);
    this.eventRegister.unbind('remove', this.remove);
    this.eventRegister.unbind('cancel', this.cancel);

    // Clear any file state classes in #prose
    this.eventRegister.trigger('updateSaveState', '', '');

    $(window).off('pagehide');
    Backbone.View.prototype.remove.call(this);
  }
});
