var $ = require('jquery-browserify');
var chosen = require('chosen-jquery-browserify');
var _ = require('underscore');

var jsyaml = require('js-yaml');
var queue = require('queue-async');

var key = require('keymaster');
var marked = require('marked');
var diff = require('diff');
var Backbone = require('backbone');
var HeaderView = require('./header');
var ToolbarView = require('./toolbar');
var MetadataView = require('./metadata');
var util = require('../util');
var upload = require('../upload');
var cookie = require('../cookie');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  id: 'post',

  template: _.template(templates.file),

  subviews: [],

  events: {
    'click .meta .finish': 'backToMode'
  },

  // TODO
  backToMode: function() { },

  initialize: function(options) {
    _.bindAll(this);

    this.router = options.router;

    // Track view mode
    this.mode = options.mode;

    this.nav = options.nav;
    this.sidebar = options.sidebar;

    this.repo = options.repo;
    this.branch = options.branch || this.repo.get('master_branch');
    this.branches = options.branches;
    this.path = options.path || '';
    this.filename = options.filename;

    var fetch = {
      success: this.setCollection
    };

    // Set model for new File models
    var model = options.model;
    if (model) {
      fetch.model = model;
    }

    this.branches.fetch(fetch);

    // Events from vertical nav
    this.listenTo(this.nav, 'new', this.new);
    this.listenTo(this.nav, 'edit', this.edit);
    this.listenTo(this.nav, 'preview', this.preview);
    this.listenTo(this.nav, 'meta', this.meta);
    this.listenTo(this.nav, 'settings', this.sidebar.toggle);
    this.listenTo(this.nav, 'save', this.showDiff);

    // Events from sidebar
    this.listenTo(this.sidebar, 'destroy', this.destroy);
    this.listenTo(this.sidebar, 'cancel', this.cancel);
    this.listenTo(this.sidebar, 'confirm', this.updateFile);

    //this.listenTo(this.toolbar, 'destroy', this.destroy);
    /*
    this.listenTo(this.nav, 'translate', this.translate, this);
    */

    // Cache jQuery window object
    var $window = $(window);

    // Stash editor and metadataEditor content to sessionStorage on pagehide event
    this.listenTo($window, 'pagehide', this.stashFile, this);

    // Prevent exit when there are unsaved changes
    this.listenTo($window, 'beforeunload', function() {
      if (this.dirty) return t('actions.unsaved');
    }, this);
  },

  setCollection: function(collection, res, options) {
    this.collection = collection.findWhere({ name: this.branch }).files;
    this.collection.fetch({ success: this.setModel, model: options.model });
  },

  cursor: function() {
    var view = this;
    var selection = util.trim(this.editor.getSelection());

    var match = {
      lineBreak: /\n/,
      h1: /^#{1}/,
      h2: /^#{2}/,
      h3: /^#{3}/,
      h4: /^#{4}/,
      strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
      italic: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
      isNumber: parseInt(selection.charAt(0), 10)
    };

    if (!match.isNumber) {
      switch (selection.charAt(0)) {
        case '#':
          if (!match.lineBreak.test(selection)) {
            if (match.h3.test(selection) && !match.h4.test(selection)) {
              this.toolbar.highlight('sub-heading');
            } else if (match.h2.test(selection) && !match.h3.test(selection)) {
              this.toolbar.highlight('heading');
            }
          }
          break;
        case '>':
          this.toolbar.highlight('quote');
          break;
        case '*':
        case '_':
          if (!match.lineBreak.test(selection)) {
            if (match.strong.test(selection)) {
              // trigger a change
              this.toolbar.highlight('bold');
            } else if (match.italic.test(selection)) {
              this.toolbar.highlight('italic');
            }
          }
          break;
        case '!':
          if (!match.lineBreak.test(selection) &&
              selection.charAt(1) === '[' &&
              selection.charAt(selection.length - 1) === ')') {
              this.toolbar.highlight('media');
          }
          break;
        case '[':
          if (!match.lineBreak.test(selection) &&
              selection.charAt(selection.length - 1) === ')') {
              this.toolbar.highlight('link');
          }
          break;
        case '-':
          if (selection.charAt(1) === ' ') {
            this.toolbar.highlight('list');
          }
        break;
        default:
          this.toolbar.highlight();
        break;
      }
    } else {
      if (selection.charAt(1) === '.' && selection.charAt(2) === ' ') {
        this.toolbar.highlight('numbered-list');
      }
    }
  },

  setModel: function(collection, res, options) {
    // Set model either by calling directly for new File models
    // or by filtering collection for existing File models
    this.model = options.model ? options.model : collection.findWhere({ path: this.path });

    this.model.fetch({
      complete: (function() {
        // TODO: save parsed config to the repo as it's used accross
        // files of the same repo and shouldn't be re-parsed each time
        this.config = collection.findWhere({ path: '_prose.yml' }) ||
          collection.findWhere({ path: '_config.yml' });

        // render view once config content has loaded
        this.config.fetch({
          complete: (function() {
            var content = this.config.get('content');

            try {
              this.config = jsyaml.load(content);
            } catch(err) {
              throw err;
            }

            this.poachConfig(this.config);

            // TODO Take this out of here when this
            // method is added to the repo level.
            if (!this.config.prose ||
              this.config.prose && !this.config.prose.metadata) {
              this.renderMetadata();
            }

            // initialize the subviews
            this.initHeading();
            this.initToolbar();
            this.initEditor();
            this.initSidebar();
          }).bind(this)
        });

        this.render();
      }).bind(this)
    });
  },

  nearestPath: function(metadata) {
    // match nearest parent directory default metadata
    var path = this.model.get('path');
    var nearestDir = /\/(?!.*\/).*$/;

    while (metadata[path] === undefined && path.match( nearestDir )) {
      path = path.replace( nearestDir, '' );
    }

    return path;
  },

  poachConfig: function(config) {
    var q = queue();

    if (config && config.prose) {
      if (config.prose.metadata) {
        // Set empty defaults on model if no match
        // to avoid loading _config.yml again unecessarily
        var defaults = {};
        var metadata;
        var path;
        var raw;

        metadata = config.prose.metadata;
        path = this.nearestPath(metadata);

        if (metadata[path]) {
          raw = config.prose.metadata[path];

          if (_.isObject(raw)) {
            defaults = raw;

            // TODO: iterate over these to add to queue synchronously
            _.each(defaults, function(value, key) {

              // Parse JSON URL values
              if (value.field && value.field.options &&
                  _.isString(value.field.options) &&
                  value.field.options.match(/^https?:\/\//)) {

                q.defer(function(cb) {
                  $.ajax({
                    cache: true,
                    dataType: 'jsonp',
                    jsonp: false,
                    jsonpCallback: value.field.options.split('?callback=')[1] || 'callback',
                    url: value.field.options,
                    success: function(d) {
                      value.field.options = d;
                      cb();
                    }
                  });
                });
              }
            });
          } else if (_.isString(raw)) {
            try {
              defaults = jsyaml.load(raw);

              if (defaults.date === "CURRENT_DATETIME") {
                var current = (new Date()).format('Y-m-d H:i');
                defaults.date = current;
                raw = raw.replace("CURRENT_DATETIME", current);
              }
            } catch(err) {
              throw err;
            }
          }
        }
      }

      q.awaitAll((function() {
        this.model.set('defaults', defaults);
        if (this.model.get('metadata')) {
          this.renderMetadata();
        }
      }).bind(this));
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
          path = parts[2];

          if (!util.absolutePath(path)) {
            // Remove any title attribute in the image tag is there is one.
            if (titleAttribute.test(path)) {
              path = path.split(titleAttribute)[0];
            }

            path = this.model.get('path');
            var raw = auth.raw + '/' + this.repo.get('owner').login + '/' + this.repo.get('name') + '/' + this.branch + '/' + (path ? path  + '/' : '') + this.model.get('name');

            if (this.repo.get('private')) {
              // append auth param
              raw += '?login=' + cookie.get('username') + '&token=' + cookie.get('oauth-token');
            }

            content = content.replace(r, '![' + parts[1] + '](' + raw + ')');
          }
        }
    });

    return content;
  },

  initEditor: function() {
    var lang = this.model.get('lang');

    // Don't set up content editor for yaml posts
    if (lang === 'yaml') return;

    // TODO: set default content for CodeMirror
    this.editor = CodeMirror(this.$el.find('#code')[0], {
      mode: lang,
      value: this.model.get('content') || '',
      lineWrapping: true,
      lineNumbers: (lang === 'gfm' || lang === null) ? false : true,
      extraKeys: this.toolbar.keyMap(),
      matchBrackets: true,
      dragDrop: false,
      theme: 'prose-bright'
    });

    // Bind Drag and Drop work on the editor
    if (this.model.get('markdown') && this.model.get('writable')) {
      upload.dragDrop(this.$el.find('#edit'), (function(e, file, content) {
        if (this.$el.find('#dialog').hasClass('dialog')) {
          this.updateImageInsert(e, file, content);
        } else {
          this.createAndUpload(e, file, content);
        }
      }).bind(this));
    }

    // Monitor the current selection and apply
    // an active class to any snippet links
    if (lang === 'gfm') {
      this.listenTo(this.editor, 'cursorActivity', this.cursor, this);
    }

    this.listenTo(this.editor, 'change', this.makeDirty, this);
    this.listenTo(this.editor, 'focus', this.focus, this);

    this.refreshCodeMirror();

    // Check sessionStorage for existing stash
    // Apply if stash exists and is current, remove if expired
    this.stashApply();
  },

  focus: function() {
    // If an upload queue is set, we want to clear it.
    this.queue = undefined;

    // If a dialog window is open and the editor is in focus, close it.
    this.$el.find('.toolbar .group a').removeClass('on');
    this.$el.find('#dialog').empty().removeClass();
  },

  initToolbar: function() {
    this.toolbar = new ToolbarView({
      view: this,
      file: this.model,
      collection: this.collection,
      config: this.config
    });

    this.subviews.push(this.toolbar);
    this.toolbar.setElement(this.$el.find('#toolbar')).render();

    this.listenTo(this.toolbar, 'updateImageInsert', this.updateImageInsert);
    this.listenTo(this.toolbar, 'draft', this.draft);
  },

  titleAsHeading: function() {
    // If the following condition is true the editable field in the
    // header should be the title of the Markdown Document.
    //
    //  1. is Markdown
    //  2. is Jekyll
    //  3. Contains a title field in its front matter
    //
    if (this.model.get('markdown') &&
        this.model.attributes.metadata &&
        this.model.attributes.metadata.title) {
      return true;
    } else {
      return false;
    }
  },

  initSidebar: function() {
    // Settings sidebar panel
    this.sidebar.initSubview('settings', {
      sidebar: this.sidebar,
      config: this.config,
      file: this.model,
      fileInput: this.titleAsHeading()
    });

    this.listenTo(this.sidebar, 'updateFile', this.makeDirty());

    // Commit message sidebar panel
    this.sidebar.initSubview('save', {
      sidebar: this.sidebar,
      file: this.model
    });
  },

  initHeading: function() {
    var inputValue = this.model.get('path');

    if (this.titleAsHeading()) {
      inputValue = this.model.attributes.metadata.title;
    }

    this.heading = new HeaderView({
      inputValue: inputValue,
      file: this.model,
      repo: this.repo,
      alterable: true
    });

    this.subviews.push(this.heading);
    this.heading.setElement(this.$el.find('#heading')).render();
    this.listenTo(this.heading, 'updateFile', this.makeDirty());
  },

  renderMetadata: function() {
    this.metadataEditor = new MetadataView({
      model: this.model,
      view: this
    });

    this.metadataEditor.setElement(this.$el.find('#meta')).render();
    this.subviews.push(this.metadataEditor);
  },

  render: function() {
    var content = this.model.get('content');

    if (this.model.get('markdown' && content)) {
      this.model.set('preview', marked(this.compilePreview(content)));
    }

    this.$el.html(this.template(_.extend(this.model.attributes, {
      mode: this.mode
    })));

    this.updateDocumentTitle();

    if (this.model.get('markdown') && this.mode === 'blob') {
      this.preview();
    } else {
      // Editor is first up so trigger an active class for it
      this.$el.find('#edit').toggleClass('active', true);
      this.$el.find('.file .edit').addClass('active');

      util.fixedScroll(this.$el.find('.topbar'));
    }

    return this;
  },

  updateDocumentTitle: function() {
    var context = (this.mode === 'blob' ? t('docheader.preview') : t('docheader.editing'));

    var path = this.model.get('path');
    var pathTitle = path ? path : '';

    // this.eventRegister.trigger('documentTitle', context + pathTitle + '/' + this.model.get('name') + ' at ' + this.branch);
  },

  new: function() {
    var dirpath = this.path.replace(/\/(?!.*\/).*$/, '');

    this.router.navigate([
      this.repo.get('owner').login,
      this.repo.get('name'),
      'new',
      this.branch,
      dirpath
    ].join('/'), true);
  },

  edit: function() {
    var view = this;

    // If preview was hit on load this.editor
    // was not initialized.
    if (!this.editor) {
      this.initEditor();
      _.delay(function() {
        util.fixedScroll($('.topbar', view.el));
      }, 1);
    }

    $('#prose').toggleClass('open', false);

    // Content Window
    this.$el.find('.views .view').removeClass('active');
    this.$el.find('#edit').addClass('active');

    this.mode = this.model.isNew() ? 'new' : 'edit';
    this.updateURL();
  },

  preview: function() {
    this.sidebar.close();

    var metadata = this.model.get('metadata');
    var jekyll = this.config && this.config.siteurl && metadata && metadata.layout;

    if (jekyll) {
      var hash = window.location.hash.split('/');
      hash[2] = 'preview';

      // if last item in hash array does not begin with Jekyll YYYY-MM-DD format,
      // append filename from input
      if (!_.last(hash).match(/^\d{4}-\d{2}-\d{2}-(?:.+)/)) {
        hash.push(_.last(this.header.headerInputGet().split('/')));
      }

      this.stashFile();

      $(e.currentTarget).attr({
        target: '_blank',
        href: hash.join('/')
      });
    } else {
      // Content Window
      this.$el.find('.views .view').removeClass('active');
      this.$el.find('#preview').addClass('active').html(marked(this.compilePreview(this.model.get('content'))));

      this.mode = 'blob';
      this.updateURL();
    }

    return jekyll;
  },

  meta: function() {
    this.sidebar.close();

    // Content Window
    this.$el.find('.views .view').removeClass('active');
    this.$el.find('#meta').addClass('active');

    this.metadataEditor.refresh();
  },

  destroy: function() {
    if (confirm(t('actions.delete.warn'))) {
      this.model.destroy({
        success: (function() {
          // TODO: this.branch.get('path')
          this.router.navigate([
            this.repo.get('owner').login,
            this.repo.get('name'),
            'tree',
            this.branch
          ].join('/'), true);
        }).bind(this),
        error: function() {
          return alert(t('actions.delete.error'));
        }
      });
    }
  },

  updateURL: function() {
    var url = _.compact([
      this.repo.get('owner').login,
      this.repo.get('name'),
      this.mode,
      this.branch,
      this.path
    ]);

    this.router.navigate(url.join('/'), {
      trigger: false,
      replace: true
    });

    this.updateDocumentTitle();

    // TODO: what is this updating?
    this.$el.find('.chzn-select').trigger('liszt:updated');
  },

  makeDirty: function(e) {
    this.dirty = true;
    if (this.editor && this.editor.getValue) this.model.set('content', this.editor.getValue());
    if (this.metadataEditor) this.model.set('metadata', this.metadataEditor.getValue());

    var label = this.model.writable ? t('actions.change.save') : t('actions.change.submit');
    // this.eventRegister.trigger('updateSaveState', label, 'save');
  },

  showDiff: function() {
    var $diff = this.$el.find('#diff');

    // TODO: why was _.escape() used here?
    var text1 = this.model.isNew() ? '' : this.model.get('previous');
    var text2 = this.model.serialize();

    var d = diff.diffWords(text1, text2);
    var length = d.length;

    var compare = '';

    for (var i = 0; i < length; i++) {
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
    $diff.html('<pre>' + compare + '</pre>').addClass('active');

    this.sidebar.open();
  },

  cancel: function() {
    this.sidebar.close();

    this.$el.find('.views .view').removeClass('active');

    if (this.mode === 'blob') {
      this.$el.find('#preview').addClass('active');
    } else {
      this.$el.find('#edit').addClass('active');
    }
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

    if (!util.validPathname(filepath)) return cb('error');
    app.state.path = this.model.path; // ?
    app.state.file = util.extractFilename(filepath)[1];
    app.state.path = util.extractFilename(filepath)[0];

    function finish() {
      view.model.path = app.state.path;
      view.model.file = app.state.file;
    }

    if (this.model.persisted) {
      window.app.models.movePost(app.state.user, app.state.repo, app.state.branch, util.filepath(this.model.path, this.model.file), filepath, _.bind(function(err) {
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

  sendPatch: function(filepath, filename, filecontent, message) {
    // Submits a patch (fork + pull request workflow)
    var view = this;

    function patch() {
      var previous = view.model.get('previous');
      if (view.updateMetaData()) {
        view.model.content = previous;
        view.editor.setValue(previous);

        app.models.patchFile(app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, function(err) {

          if (err) {
            view.eventRegister.trigger('updateSaveState', t('actions.error'), 'error');
            return;
          }

          view.dirty = false;
          view.model.persisted = true;
          view.model.file = filename;

          view.updateURL();
          view.model.set('previous', filecontent);
          view.sidebar.close();
          view.updatePublishState();
          view.eventRegister.trigger('updateSaveState', t('actions.save.submission'), 'saved');
        });
      } else {
        view.eventRegister.trigger('updateSaveState', t('actions.save.metaError'), 'error');
      }
    }

    view.eventRegister.trigger('updateSaveState', t('actions.save.patch'), 'saving');
    patch();

    return false;
  },

  draft: function() {

    // TODO Fix this all up.
    var filepath = _.extractFilename(this.header.headerInputGet());
    var basepath = filepath[0].split('/');
    var filename = filepath[1];
    var postType = basepath[0];
    var filecontent = this.serialize();
    var message = t('actions.commits.toDraft', { filename: filename });

    if (postType === '_posts') {
      basepath.splice(0, 1, '_drafts');
      filepath.splice(0, 1, basepath.join('/'));
      this.saveDraft(filepath.join('/'), filename, filecontent, message);
      app.state.path = this.model.path = filepath[0];
    } else {
      basepath.splice(0, 1, '_posts');
      filepath.splice(0, 1, basepath.join('/'));
      message = t('actions.commits.fromDraft', { filename: filename });
      this.saveFile(filepath.join('/'), filename, filecontent, message);
      app.state.path = this.model.path = filepath[0];
    }

    return false;
  },

   saveDraft: function(filepath, filename, filecontent, message) {
    var view = this;
    view.eventRegister.trigger('updateSaveState', t('actions.save.saving'), 'saving');
    window.app.models.saveFile(app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, function(err) {
      if (err) {
        view.eventRegister.trigger('updateSaveState', t('actions.error'), 'error');
        return;
      }
      view.dirty = false;
      view.model.persisted = true;
      view.model.file = filename;
      this.toolbar.render();

      if (app.state.mode === 'new') app.state.mode = 'edit';
      view.renderHeading();
      view.updateURL();
      view.prevFile = filecontent;
      view.closeSettings();
      view.updatePublishState();
      view.eventRegister.trigger('updateSaveState', t('actions.save.saved'), 'saved', true);
    });
  },

  saveFile: function(filepath, filename, filecontent, message) {
    var view = this;

    function save() {
      if (view.updateMetaData()) {

        window.app.models.saveFile(app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, function(err) {
          if (err) {
            view.eventRegister.trigger('updateSaveState', t('actions.error'), 'error');
            return;
          }

          view.dirty = false;
          view.model.persisted = true;
          view.model.file = filename;
          this.toolbar.render();

          if (app.state.mode === 'new') app.state.mode = 'edit';
          this.heading.render();
          view.updateURL();
          view.model.set('previous', filecontent);
          view.sidebar.close();
          view.updatePublishState();
          view.eventRegister.trigger('updateSaveState', t('actions.save.saved'), 'saved', true);
        });
      } else {
        view.eventRegister.trigger('updateSaveState', t('actions.save.metaError'), 'error');
      }
    }

    // view.eventRegister.trigger('updateSaveState', 'Saving', 'saving');

    if (filepath === util.filepath(this.model.path, this.model.file)) return save();

    // Move or create file
    this.updateFilename(filepath, function(err) {
      if (err) {
        view.eventRegister.trigger('headerInputFocus');
        view.eventRegister.trigger('updateSaveState', t('actions.save.fileNameError'), 'error');
      } else {
        save();
      }
    });
  },

  updatePublishState: function() {
    // Update the publish key wording depening on what was saved
    var $publishKey = $('.publish-flag', this.el);
    var key = $publishKey.attr('data-state');

    if (key === 'true') {
      $publishKey.html(t('actions.publishing.published') + '<span class="ico checkmark"></span>');
    } else {
      $publishKey.html(t('actions.publishing.unpublished') + 'Unpublished<span class="ico checkmark"></span>');
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
    var filepath = this.model.get('path');
    var item = store.getItem(filepath);
    var stash = JSON.parse(item);

    if (stash && stash.sha === this.model.get('sha')) {
      // Restore from stash if file sha hasn't changed
      if (this.editor && this.editor.setValue) this.editor.setValue(stash.content);
      if (this.metadataEditor) {
        // this.rawEditor.setValue('');
        this.metadataEditor.setValue(stash.metadata);
      }
    } else if (item) {
      // Remove expired content
      store.removeItem(filepath);
    }
  },

  updateFile: function() {
    var filepath = this.header.headerInputGet();
    var filename = util.extractFilename(filepath)[1];
    var filecontent = this.model.serialize();
    var $message = $('.commit-message');
    var noVal = 'Updated ' + filename;
    if (app.state.mode === 'new') noVal = 'Created ' + filename;

    var message = $message.val() || noVal;
    var method = this.model.get('writable') ? this.saveFile : this.sendPatch;
    var method = this.model.get('writable') ? this.model.save : this.sendPatch;

    // Update content
    this.model.content = (this.editor) ? this.editor.getValue() : '';

    // Delegate
    // method.call(this, filepath, filename, filecontent, message);
    method.call(this);
    return false;
  },

  updateSaveState: function(label, classes, kill) {
    var view = this;

    // Cancel if this condition is met
    if (classes === 'save' && $(this.el).hasClass('saving')) return;
    $('.button.save', this.el).html(label);

    // Pass a popover span to the avatar icon
    $('#heading', this.el).find('.popup').html(label);
    $('.action').find('.popup').html(label);

    $(this.el)
      .removeClass('error saving saved save')
      .addClass(classes);

    if (kill) {
      _.delay(function() {
        $(view.el).removeClass(classes);
      }, 1000);
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

  updateImageInsert: function(e, file, content) {
    this.queue = {
      e: e,
      file: file,
      content: content
    };
  },

  createAndUpload: function(e, file, content, userDefinedPath) {
    var view = this;

    // Loading State
    this.eventRegister.trigger('updateSaveState', t('actions.upload.uploading', { file: file.name }), 'saving');

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
    window.app.models.loadPosts(app.state.user, app.state.repo, app.state.branch, util.extractFilename(path)[0], function(err, res) {
      if (err) return view.eventRegister.trigger('updateSaveState', t('actions.error'), 'error');

      // Check whether the current (or media) directory
      // contains the same filename as the one a user wishes
      // to upload. we want to update the file by passing the sha
      // to the data object in this case.
      _(res.files).each(function(f) {
        var parts = util.extractFilename(f.path);
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

      window.app.models.uploadFile(app.state.user, app.state.repo, path, data, function(type, res) {
        if (type === 'error') {
          view.eventRegister.trigger('updateSaveState', t('actions.error'), 'error');
        } else {
          var $alt = $('input[name="alt"]');
          var image = ($alt.val) ?
            '![' + $alt.val() + '](/' + path + ')' :
            '![' + file.name + '](/' + path + ')';

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
          var fileParts = util.extractFilename(res.content.path);
          var structuredPath = [fileParts[0], encodeURIComponent(fileParts[1])].join('/');

          view.recentlyUploadedFiles.push({
            path: structuredPath,
            sha: res.content.sha
          });
        }
      });
    });
  },

  remove: function() {
    this.stashFile();

    _.invoke(this.subviews, 'remove');
    this.subviews = [];

    // Clear any file state classes in #prose
    // this.eventRegister.trigger('updateSaveState', '', '');

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
