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
var MetadataView = require('./metadata');
var util = require('../util');
var upload = require('../upload');
var cookie = require('../cookie');
var toolbar = require('../toolbar/markdown.js');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  id: 'post',

  template: _.template(templates.file),

  subviews: [],

  events: {
    'click .group a': 'markdownSnippet',
    'click .dialog .insert': 'dialogInsert',
    'click .save-action': 'updateFile',
    'click .publish-flag': 'togglePublishing',
    'change #upload': 'fileInput'
  },

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

    if (this.model) {
      // TODO: set defaults, build UI
      this.render();
    } else {
      this.branches.fetch({ success: this.setCollection });
    }

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

    /*
    this.listenTo(this.nav, 'translate', this.translate, this);
    */

    // Cache jQuery window object
    var $window = $(window);

    // Stash editor and metadataEditor content to sessionStorage on pagehide event
    this.listenTo($window, 'pagehide', this.stashFile, this);

    // Prevent exit when there are unsaved changes
    this.listenTo($window, 'beforeunload', function() {
      if (this.dirty) return 'You have unsaved changes. Are you sure you want to leave?';
    }, this);

    /*
    this.config = {};

    if (app.state.config && app.state.config.prose) {
      this.config.siteurl = app.state.config.prose.siteurl || false;
      this.config.relativeLinks = app.state.config.prose.relativeLinks || false;
      this.config.media = app.state.config.prose.media || false;
    }
    */
  },

  setCollection: function() {
    this.collection = this.branches.findWhere({ name: this.branch }).files;
    this.collection.fetch({ success: this.setModel });
  },

  setModel: function() {
    this.model = this.collection.findWhere({ path: this.path });

    this.model.fetch({
      complete: (function() {
        this.config = this.collection.findWhere({ path: '_prose.yml' }) ||
          this.collection.findWhere({ path: '_config.yml' });

        // render view once config content has loaded
        this.config.fetch({
          complete: (function() {
            var content = this.config.get('content');
            var config;

            try {
              config = jsyaml.load(content);
            } catch(err) {
              throw err;
            }

            this.setDefaults(config);

            // Settings sidebar panel
            this.sidebar.initSubview('settings', {
              sidebar: this.sidebar,
              config: config,
              file: this.model
            });

            // Commit message sidebar panel
            this.sidebar.initSubview('save', {
              sidebar: this.sidebar,
              file: this.model
            });
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

  setDefaults: function(config) {
    var q = queue();

    // Set empty defaults on model if no match
    // to avoid loading _config.yml again unecessarily
    var defaults = {};

    var metadata;
    var path;
    var raw;

    if (config && config.prose && config.prose.metadata) {
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
      if (this.model.get('metadata')) this.renderMetadata();
    }).bind(this));
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

          if (!util.absolutePath(path)) {
            // Remove any title attribute in the image tag is there is one.
            if (titleAttribute.test(path)) {
              path = path.split(titleAttribute)[0];
            }

            var path = this.model.get('path');
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

  cursor: function() {
    var selection = util.trim(this.editor.getSelection());
    this.$el.find('.toolbar .group a').removeClass('active');

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
              $('[data-key="sub-heading"]').addClass('active');
            } else if (match.h2.test(selection) && !match.h3.test(selection)) {
              $('[data-key="heading"]').addClass('active');
            }
          }
          break;
        case '>':
          this.$el.find('[data-key="quote"]').addClass('active');
          break;
        case '*':
        case '_':
          if (!match.lineBreak.test(selection)) {
            if (match.strong.test(selection)) {
              this.$el.find('[data-key="bold"]').addClass('active');
            } else if (match.italic.test(selection)) {
              this.$el.find('[data-key="italic"]').addClass('active');
            }
          }
          break;
        case '!':
          if (!match.lineBreak.test(selection) &&
              selection.charAt(1) === '[' &&
              selection.charAt(selection.length - 1) === ')') {
            this.$el.find('[data-key="media"]').addClass('active');
          }
          break;
        case '[':
          if (!match.lineBreak.test(selection) &&
              selection.charAt(selection.length - 1) === ')') {
            this.$el.find('[data-key="link"]').addClass('active');
          }
          break;
        case '-':
          if (selection.charAt(1) === ' ') {
            this.$el.find('[data-key="list"]').addClass('active');
          }
        break;
      }
    } else {
      if (selection.charAt(1) === '.' && selection.charAt(2) === ' ') {
        this.$el.find('[data-key="numbered-list"]').addClass('active');
      }
    }
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
      extraKeys: this.keyMap(),
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

  renderHeading: function() {
    var header = new HeaderView({
      file: this.model,
      repo: this.repo,
      alterable: true
    });

    header.setElement(this.$el.find('#heading')).render();
    this.subviews.push(header);
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
    /*
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
    */

    var content = this.model.get('content');

    if (this.model.get('markdown' && content)) {
      this.model.set('preview', marked(this.compilePreview(content)));
    }

    this.$el.html(this.template(_.extend(this.model.attributes, {
      mode: this.mode
    })));

    // Render subviews
    this.renderHeading();
    this.updateDocumentTitle();

    if (this.model.get('markdown') && this.mode === 'blob') {
      this.preview();
    } else {
      // Editor is first up so trigger an active class for it
      this.$el.find('#edit').toggleClass('active', true);
      this.$el.find('.file .edit').addClass('active');

      this.initEditor();

      util.fixedScroll(this.$el.find('.topbar'));
    }

    return this;
  },

  updateDocumentTitle: function() {
    var context = (this.mode === 'blob' ? 'Previewing ' : 'Editing ');

    var path = this.model.get('path');
    var pathTitle = path ? path : '';

    // this.eventRegister.trigger('documentTitle', context + pathTitle + '/' + this.model.get('name') + ' at ' + this.branch);
  },

  new: function() {
    var dirpath = this.path.replace(/\/(?!.*\/).*$/, '');
    var filename = undefined;

    this.router.navigate([
      this.repo.get('owner').login,
      this.repo.get('name'),
      'new',
      this.branch,
      dirpath,
      filename
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
        hash.push(_.last($('input.filepath').val().split('/')));
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
    if (confirm('Are you sure you want to delete this file?')) {
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
          return alert('Error during deletion. Please wait 30 seconds and try again.');
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

    var label = this.model.get('writable') ? 'Unsaved Changes' : 'Submit Change';
    // this.eventRegister.trigger('updateSaveState', label, 'save');

    // Pass a popover span to the avatar icon
    this.$el.find('.save-action .popup').html(this.model.get('alterable') ? 'Save' : 'Submit Change');
  },

  togglePublishing: function(e) {
    var $target = $(e.currentTarget);

    // TODO: remove HTML from view
    if ($target.hasClass('published')) {
      $target
        .empty()
        .html('Unpublish<span class="ico small checkmark"></span>')
        .removeClass('published')
        .attr('data-state', false);
    } else {
      $target
        .empty()
        .html('Publish<span class="ico small checkmark"></span>')
        .addClass('published')
        .attr('data-state', true);
    }

    this.makeDirty();

    return false;
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
            view.eventRegister.trigger('updateSaveState', '!&nbsp;Try&nbsp;again&nbsp;in 30&nbsp;seconds', 'error');
            return;
          }

          view.dirty = false;
          view.model.persisted = true;
          view.model.file = filename;

          view.updateURL();
          view.model.set('previous', filecontent);
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

          if (app.state.mode === 'new') app.state.mode = 'edit';
          view.renderHeading();
          view.updateURL();
          view.model.set('previous', filecontent);
          view.closeSettings();
          view.updatePublishState();
          view.eventRegister.trigger('updateSaveState', 'Saved', 'saved', true);
        });
      } else {
        view.eventRegister.trigger('updateSaveState', '!Metadata', 'error');
      }
    }

    // view.eventRegister.trigger('updateSaveState', 'Saving', 'saving');

    if (filepath === util.filepath(this.model.path, this.model.file)) return save();

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
        // this.rawEditor.setValue('');
        this.metadataEditor.setValue(stash.metadata);
      }
    } else if (item) {
      // Remove expired content
      store.removeItem(filepath);
    }
  },

  updateFile: function() {
    var filepath = $('input.filepath').val();
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
    app.models.loadPosts(app.state.user, app.state.repo, app.state.branch, util.extractFilename(path)[0], function(err, res) {
      if (err) return view.eventRegister.trigger('updateSaveState', 'Error Uploading try again in 30 Seconds!', 'error');

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

      app.models.uploadFile(app.state.user, app.state.repo, path, data, function(type, res) {
        if (type === 'error') {
          view.eventRegister.trigger('updateSaveState', 'Error&nbsp;Uploading try again in 30 Seconds!', 'error');
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

  markdownSnippet: function(e) {
    var view = this;
    var $target = $(e.target, this.el).closest('a');
    var $dialog = $('#dialog', this.el);
    var $snippets = $('.toolbar .group a', this.el);
    var key = $target.data('key');
    var snippet = $target.data('snippet');
    var selection = util.trim(this.editor.getSelection());

    console.log('yep');
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
        path: path + '/' + encodeURIComponent(asset.name),
        isMedia: util.isMedia(path)
      }));
    });

    $('.asset a', $media).on('click', function(e) {
      var href = $(this).attr('href');
      var alt = util.trim($(this).text());

      if (util.isImage(href)) {
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
        this.editor.replaceSelection('![' + alt + '](/' + src + ')');
        this.editor.focus();
      }
    }

    return false;
  },

  heading: function(s) {
    if (s.charAt(0) === '#' && s.charAt(2) !== '#') {
      this.editor.replaceSelection(_.lTrim(s.replace(/#/g, '')));
    } else {
      this.editor.replaceSelection('## ' + s.replace(/#/g, ''));
    }
  },

  subHeading: function(s) {
    if (s.charAt(0) === '#' && s.charAt(3) !== '#') {
      this.editor.replaceSelection(_.lTrim(s.replace(/#/g, '')));
    } else {
      this.editor.replaceSelection('### ' + s.replace(/#/g, ''));
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
      this.editor.replaceSelection(util.lTrim(s.replace(/\>/g, '')));
    } else {
      this.editor.replaceSelection('> ' + s.replace(/\>/g, ''));
    }
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
