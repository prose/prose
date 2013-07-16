var $ = require('jquery-browserify');
var chosen = require('chosen-jquery-browserify');
var _ = require('underscore');

var queue = require('queue-async');

var ModalView = require('./modal');
var key = require('keymaster');
var marked = require('marked');
var diff = require('diff');
var Backbone = require('backbone');
var File = require('../models/file');
var HeaderView = require('./header');
var ToolbarView = require('./toolbar');
var MetadataView = require('./metadata');
var util = require('../util');
var upload = require('../upload');
var cookie = require('../cookie');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  id: 'post',

  template: templates.file,

  subviews: {},

  initialize: function(options) {
    _.bindAll(this);

    this.branch = options.branch || options.repo.get('master_branch');
    this.branches = options.branches;
    this.mode = options.mode;
    this.nav = options.nav;
    this.path = options.path || '';
    this.repo = options.repo;
    this.router = options.router;
    this.sidebar = options.sidebar;

    // Set the active nav element established by this.mode
    // TODO: this breaks for mode 'new'
    this.nav.setFileState(this.mode);

    // Events from vertical nav
    this.listenTo(this.nav, 'edit', this.edit);
    this.listenTo(this.nav, 'preview', this.preview);
    this.listenTo(this.nav, 'meta', this.meta);
    this.listenTo(this.nav, 'settings', this.sidebar.toggle);
    this.listenTo(this.nav, 'save', this.showDiff);

    // Events from sidebar
    this.listenTo(this.sidebar, 'destroy', this.destroy);
    this.listenTo(this.sidebar, 'cancel', this.cancel);
    this.listenTo(this.sidebar, 'confirm', this.updateFile);
    this.listenTo(this.sidebar, 'translate', this.translate);

    // Cache jQuery window object
    var $window = $(window);

    // Stash editor and metadataEditor content to sessionStorage on pagehide event
    this.listenTo($window, 'pagehide', this.stashFile, this);

    // Prevent exit when there are unsaved changes
    this.listenTo($window, 'beforeunload', function() {
      if (this.dirty) return t('actions.unsaved');
    }, this);

    this.branches.fetch({ success: this.setCollection });
  },

  setCollection: function(collection, res, options) {
    this.collection = collection.findWhere({ name: this.branch }).files;
    this.collection.fetch({ success: this.setModel, args: arguments });
  },

  setModel: function(model, res, options) {
    // Set default metadata from collection
    var defaults = this.collection.defaults;
    var path;

    // Set model either by calling directly for new File models
    // or by filtering collection for existing File models
    switch(this.mode) {
      case 'edit':
        this.model = this.collection.findWhere({ path: this.path });
        break;
      case 'new':
        this.model = new File({
          branch: this.branch,
          collection: this.collection,
          path: this.path,
          repo: this.repo
        });
        break;
    }

    if (defaults) {
      path = this.nearestPath(defaults);
      this.model.set('defaults', defaults[path]);
    }

    // Render on complete to render even if model does not exist on remote yet
    this.model.fetch({ complete: this.render });
  },

  nearestPath: function(defaults) {
    // Match nearest parent directory default metadata
    // Match paths in _drafts to corresponding defaults set at _posts
    var path = this.model.get('path').replace(/^(_drafts)/, '_posts');
    var nearestDir = /\/(?!.*\/).*$/;

    while (defaults[path] === undefined && nearestDir.test(path)) {
      path = path.replace( nearestDir, '' );
    }

    return path;
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
              // TODO This is not correct. See #491
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
          // Clear selection
          this.editor.focus();
          this.editor.replaceSelection('');

          // Append images links in this.upload()
          this.upload(e, file, content);
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

  keyMap: function() {
    var self = this;

    if (this.model.get('markdown')) {
      return {
        'Ctrl-S': function(codemirror) {
          self.updateFile();
        },
        'Cmd-B': function(codemirror) {
          if (self.editor.getSelection() !== '') self.toolbar.bold(self.editor.getSelection());
        },
        'Ctrl-B': function(codemirror) {
          if (self.editor.getSelection() !== '') self.toolbar.bold(self.editor.getSelection());
        },
        'Cmd-I': function(codemirror) {
          if (self.editor.getSelection() !== '') self.toolbar.italic(self.editor.getSelection());
        },
        'Ctrl-I': function(codemirror) {
          if (self.editor.getSelection() !== '') self.toolbar.italic(self.editor.getSelection());
        }
      };
    } else {
      return {
        'Ctrl-S': function(codemirror) {
          self.updateFile();
        }
      };
    }
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

    this.subviews['toolbar'] = this.toolbar;
    this.toolbar.setElement(this.$el.find('#toolbar')).render();

    this.listenTo(this.toolbar, 'updateImageInsert', this.updateImageInsert);
    this.listenTo(this.toolbar, 'draft', this.draft);
  },

  titleAsHeading: function() {
    // If the file is Markdown, has metadata and has a title, 
    // the editable field in the header should be
    // the title of the Markdown document.

    var metadata = this.model.get('metadata');
    return (this.model.get('markdown') && metadata && metadata.title);
  },

  initSidebar: function() {
    // Settings sidebar panel
    this.settings = this.sidebar.initSubview('settings', {
      sidebar: this.sidebar,
      config: this.collection.config,
      file: this.model,
      fileInput: this.titleAsHeading()
    }).render();
    this.subviews['settings'] = this.settings;

    this.listenTo(this.sidebar, 'updateFile', this.makeDirty());

    // Commit message sidebar panel
    this.save = this.sidebar.initSubview('save', {
      sidebar: this.sidebar,
      file: this.model
    }).render();
    this.subviews['save'] = this.save;
  },

  initHeader: function() {
    var input = this.titleAsHeading() ? this.model.get('metadata').title :
      this.model.get('path');

    this.header = new HeaderView({
      input: input,
      file: this.model,
      repo: this.repo,
      alterable: true,
      placeholder: this.model.isNew() && !this.model.translate
    });

    this.subviews['header'] = this.header;
    this.header.setElement(this.$el.find('#heading')).render();
    this.listenTo(this.header, 'makeDirty', this.makeDirty);
  },

  renderMetadata: function() {
    this.metadataEditor = new MetadataView({
      model: this.model,
      titleAsHeading: this.titleAsHeading(),
      view: this
    });

    this.metadataEditor.setElement(this.$el.find('#meta')).render();
    this.subviews['metadata'] = this.metadataEditor;
  },

  render: function() {
    if (this.mode === 'preview') {
      this.preview();
    } else {
      var content = this.model.get('content');

      if (this.model.get('markdown' && content)) {
        this.model.set('preview', marked(this.compilePreview(content)));
      }

      var file = {
        markdown: this.model.get('markdown')
      };

      this.$el.empty().append(_.template(this.template, file, {
        variable: 'file'
      }));

      // Store the configuration object from the collection
      this.config = this.model.get('collection').config;

      // initialize the subviews
      this.initEditor();
      this.initHeader();
      this.initToolbar();
      this.initSidebar();

      // Update the navigation view with a meta
      // class name if this post contains it
      if (this.model.get('metadata')) {
        this.renderMetadata();
        this.nav.mode('file meta');
      }

      this.updateDocumentTitle();

      // Preview needs access to marked, so it's registered here
      Liquid.Template.registerFilter({
        'markdownify': function(input) {
          return marked(input || '');
        }
      });

      if (this.model.get('markdown') && this.mode === 'blob') {
        this.blob();
      } else {
        // Editor is first up so trigger an active class for it
        this.$el.find('#edit').toggleClass('active', true);
        this.$el.find('.file .edit').addClass('active');

        util.fixedScroll(this.$el.find('.topbar'));
      }
    }

    return this;
  },

  updateDocumentTitle: function() {
    var context = (this.mode === 'blob' ? t('docheader.preview') : t('docheader.editing'));

    var path = this.model.get('path');
    var pathTitle = path ? path : '';

    util.documentTitle(context + ' ' + pathTitle + '/' + this.model.get('name') + ' at ' + this.branch);
  },

  edit: function() {
    var view = this;
    this.sidebar.close();

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

  blob: function() {
    this.sidebar.close();

    var metadata = this.model.get('metadata');
    var jekyll = this.config && this.config.siteurl && metadata && metadata.layout;

    if (jekyll) {
      var hash = window.location.hash.split('/');
      hash[2] = 'preview';

      // If last item in hash array does not begin with Jekyll YYYY-MM-DD format,
      // append filename from input
      var regex = /^\d{4}-\d{2}-\d{2}-(?:.+)/;
      if (!regex.test(_.last(hash))) {
        hash.push(_.last(this.filepath().split('/')));
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

  preview: function() {
    var q = queue(1);
    var metadata = this.model.get('metadata');

    var p = {
      site: this.config,
      post: metadata,
      page: metadata,
      content: Liquid.parse(marked(this.model.get('content'))).render({
        site: this.config,
        post: metadata,
        page: metadata
      }) || ''
    };

    function getLayout(cb) {
      var file = p.page.layout;
      var layout = this.collection.findWhere({ path: '_layouts/' + file + '.html' });

      layout.fetch({
        success: (function(model, res, options) {
          var meta = model.get('metadata');
          var content = model.get('content');
          var template = Liquid.parse(content);

          p.page = _.extend(metadata, meta);

          p.content = template.render({
            site: p.site,
            post: p.post,
            page: p.page,
            content: p.content
          });

          // Handle nested layouts
          if (meta && meta.layout) q.defer(getLayout.bind(this));

          cb();
        }).bind(this)
      })
    }

    q.defer(getLayout.bind(this));

    q.await((function() {
      var content = p.content;

      // Set base URL to public site
      if (this.config.prose && this.config.prose.siteurl) {
        content = content.replace(/(<head(?:.*)>)/, (function() {
          return arguments[1] + '<base href="' + this.config.prose.siteurl + '">';
        }).bind(this));
      }

      document.write(content);
      document.close();
    }).bind(this));
  },

  meta: function() {
    this.sidebar.close();

    // Content Window
    this.$el.find('.views .view').removeClass('active');
    this.$el.find('#meta').addClass('active');

    // Refresh any textarea's in the frontmatter form that use codemirror
    this.metadataEditor.refresh();
  },

  destroy: function() {
    if (confirm(t('actions.delete.warn'))) {
      this.model.destroy({
        success: (function() {
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

    // Update Content.
    if (this.editor && this.editor.getValue) {
      this.model.set('content', this.editor.getValue());
    }

    // Update MetaData
    if (this.metadataEditor) {
      this.model.set('metadata', this.metadataEditor.getValue());
    }

    // Update the filename in the sidebar
    // TODO: how is this supposed to work?
    /*
    if (this.model.isNew()) {
      this.sidebar.updateFilepath(this.model.get('path'));
    }
    */

    var label = this.model.get('writable') ?
      t('actions.change.save') :
      t('actions.change.submit');

    this.updateSaveState(label, 'save');
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

    $diff.addClass('active');
    $diff.find('.diff-content').empty().append('<pre>' + compare + '</pre>');

    this.sidebar.open();
  },

  cancel: function() {

    // Close the sidebar and return the
    // active nav item to the current file mode.
    this.sidebar.close();
    this.nav.active(this.mode);

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

  patch: function() {
    // Submit a patch (fork + pull request workflow)
    this.updateSaveState(t('actions.save.patch'), 'saving');

    // view.updateMetaData();

    this.model.patch({
      success: (function(res) {
        /*
        // TODO: revert to previous state?
        var previous = view.model.get('previous');
        this.model.content = previous;
        this.editor.setValue(previous);
        this.dirty = false;
        this.model.persisted = true;
        this.model.file = filename;
        this.model.set('previous', filecontent);
        */

        // TODO: why is this breaking?
        // this.toolbar.updatePublishState();

        this.updateURL();
        this.sidebar.close();
        this.updateSaveState(t('actions.save.submission'), 'saved');
      }).bind(this),
      error: (function(model, xhr, options) {
        var res = JSON.parse(xhr.responseText);
        this.updateSaveState(res.message, 'error');
      }).bind(this)
    });
  },

  filepath: function() {
    if (this.titleAsHeading()) {
      return this.sidebar.filepathGet();
    } else {
      return this.header.inputGet();
    }
  },

  draft: function() {
    // TODO: Fix this all up.
    var filepath = _.extractFilename(this.filepath());
    var basepath = filepath[0].split('/');
    var filename = filepath[1];
    var postType = basepath[0];
    var filecontent = this.serialize();
    var message = t('actions.commits.toDraft', { filename: filename });

    if (postType === '_posts') {
      basepath.splice(0, 1, '_drafts');
      filepath.splice(0, 1, basepath.join('/'));
      // this.saveDraft(filepath.join('/'), filename, filecontent, message);
      app.state.path = this.model.path = filepath[0];
    } else {
      basepath.splice(0, 1, '_posts');
      filepath.splice(0, 1, basepath.join('/'));
      message = t('actions.commits.fromDraft', { filename: filename });
      // this.saveFile(filepath.join('/'), filename, filecontent, message);
      app.state.path = this.model.path = filepath[0];
    }

    return false;
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
    var view = this;

    // Trigger the save event
    this.updateSaveState(t('actions.save.saving'), 'saving');
    var filepath = this.filepath();
    var filename = util.extractFilename(filepath)[1];
    var filecontent = this.model.serialize();
    var $message = $('.commit-message');

    var noVal = this.model.isNew() ?
      t('actions.commits.created', {
        filename: filename
      }) :
      t('actions.commits.updated', {
        filename: filename
      });

    var message = $message.val() || noVal;
    var method = this.model.get('writable') ? this.model.save : this.patch;

    //this.updateSaveState(t('actions.save.metaError'), 'error');
    //this.updateSaveState(t('actions.error'), 'error');
    //this.updateSaveState(t('actions.save.saved'), 'saved', true);
    //this.updateSaveState(t('actions.save.fileNameError'), 'error');

    // Validation checking
    this.model.on('invalid', function(model, error) {
      view.modal = new ModalView({
        message: error
      });

      view.$el.find('#modal').empty().append(view.modal.el);
      view.modal.render();
    });

    // Update content
    this.model.content = (this.editor) ? this.editor.getValue() : '';

    // Delegate
    method.call(this);
    return false;
  },

  updateSaveState: function(label, classes, kill) {
    // Cancel if this condition is met
    if (classes === 'save' && $(this.el).hasClass('saving')) return;

    // Update the Header
    if (this.header) this.header.updateState(label);

    // Update the Sidebar save button
    if (this.sidebar) this.sidebar.updateState(label);

    // Update the avatar in the toolbar
    if (this.toolbar) this.toolbar.updateState(label);

    this.$el
      .removeClass('error saving saved save')
      .addClass(classes);

    if (kill) {
      _.delay((function() {
        this.$el.removeClass(classes);
      }).bind(this), 1000);
    }
  },

  translate: function(e) {
    if (e) e.preventDefault();

    // TODO: Drop the 'en' requirement.
    var hash = window.location.hash.split('/'),
      href = $(e.currentTarget).attr('href').substr(1);

    // If current page is not english and target page is english
    if (href === 'en') {
      hash.splice(-2, 2, hash[hash.length - 1]);
      // If current page is english and target page is not english
    } else if (this.model.get('metadata').lang === 'en') {
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

  upload: function(e, file, content, path) {
    // Loading State
    this.updateSaveState(t('actions.upload.uploading', { file: file.name }), 'saving');

    // Default to current directory if no path specified
    var parts = util.extractFilename(this.path);
    path = path || [parts[0], file.name].join('/');

    this.collection.upload(file, content, path, {
      success: (function(model, res, options) {
        var name = res.content.name;
        var path = res.content.path;

        // TODO: where does $alt exist in the UI?
        var $alt = $('input[name="alt"]');
        var value = $alt.val();
        var image = (value) ?
          '![' + value + '](/' + path + ')' :
          '![' + name + '](/' + path + ')';

        this.editor.focus();
        this.editor.replaceSelection(image + '\n', 'end');
        this.updateSaveState('Saved', 'saved', true);

        // Update the media directory
        if (this.assets) {
          this.assets[res.content.sha]({
            name: name,
            type: 'blob', // TODO: type: 'file'?
            path: path
          });
        }
      }).bind(this),
      error: (function(model, xhr, options) {
        // Display error message returned by XHR
        var res = JSON.parse(xhr.responseText);
        this.updateSaveState(res.message, 'error');
      }).bind(this)
    });
  },

  remove: function() {
    this.stashFile();

    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    // Clear any file state classes in #prose
    this.updateSaveState('', '');

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
