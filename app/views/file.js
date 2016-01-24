var $ = require('jquery-browserify');
var _ = require('underscore');
var queue = require('queue-async');
var jsyaml = require('js-yaml');
var patch = require('../../vendor/liquid.patch');
var Handsontable = require('handsontable');
var Papa = require('papaparse');

var ModalView = require('./modal');
var marked = require('marked');
var diff = require('diff');
var Backbone = require('backbone');
var File = require('../models/file');
var HeaderView = require('./header');
var ToolbarView = require('./toolbar');
var MetadataView = require('./metadata');
var auth = require('../config');
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

    var app = options.app;
    app.loader.start();

    // Patch Liquid
    patch.apply(this);

    this.app = app;
    this.branch = options.branch || options.repo.get('default_branch');
    this.branches = options.branches;
    this.mode = options.mode;
    this.nav = options.nav;
    this.path = options.path || '';
    this.repo = options.repo;
    this.router = options.router;
    this.sidebar = options.sidebar;

    // Set the active nav element established by this.mode
    this.nav.setFileState(this.mode);

    // Events from vertical nav
    this.listenTo(this.nav, 'edit', this.edit);
    this.listenTo(this.nav, 'blob', this.blob);
    this.listenTo(this.nav, 'meta', this.meta);
    this.listenTo(this.nav, 'settings', this.settings);
    this.listenTo(this.nav, 'save', this.showDiff);

    // Events from sidebar
    this.listenTo(this.sidebar, 'destroy', this.destroy);
    this.listenTo(this.sidebar, 'toggle-editor', this.toggleEditor);
    this.listenTo(this.sidebar, 'draft', this.draft);
    this.listenTo(this.sidebar, 'cancel', this.cancel);
    this.listenTo(this.sidebar, 'confirm', this.updateFile);
    this.listenTo(this.sidebar, 'translate', this.translate);

    // Stash editor and metadataEditor content to sessionStorage on pagehide event
    this.listenTo($(window), 'pagehide', this.stashFile);

    // Prevent exit when there are unsaved changes
    // jQuery won't bind to 'beforeunload' event
    // e.returnValue for Firefox compatibility
    // https://developer.mozilla.org/en-US/docs/Web/Reference/Events/beforeunload
    window.onbeforeunload = (function(e) {
      if (this.dirty) {
        var message = t('actions.unsaved');
        (e || window.event).returnValue = message;

        return message;
      }
    }).bind(this);

    this.branches.fetch({
      success: this.setCollection,
      error: (function(model, xhr, options) {
        this.router.error(xhr);
      }).bind(this),
      complete: app.loader.done
    });
  },

  setCollection: function() {
    this.app.loader.start();

    this.collection = this.branches.findWhere({ name: this.branch }).files;
    this.collection.fetch({
      success: this.setModel,
      error: (function(model, xhr, options) {
        this.router.error(xhr);
      }).bind(this),
      complete: this.app.loader.done,
      args: arguments
    });
  },

  setModel: function() {
    this.app.loader.start();

    // Set model either by calling directly for new File models
    // or by filtering collection for existing File models
    switch(this.mode) {
      case 'edit':
      case 'blob':
        this.model = this.collection.findWhere({ path: this.path });
        break;
      case 'preview':
        this.model = this.collection.findWhere({ path: this.path });
        if (!this.model) {
          // We may be trying to preview a new file that only has
          // stashed information lets check and create a dummy model
          var previewPath = this.absolutePathFromComponents (
            this.repo.get('owner').login,
            this.repo.get('name'),
            this.branch,
            this.path
          );
          if (this.getStashForPath(previewPath)) {
            this.model = this.newEmptyFile();
          }
        }
        break;
      case 'new':
        this.model = this.newEmptyFile();
        break;
    }

    // Set default metadata from collection
    var defaults = this.collection.defaults;
    var path;
    if (this.model) {
      if (defaults) {
        path = this.nearestPath(this.model.get('path'), defaults);
        this.model.set('defaults', defaults[path]);
      }

      // Render on complete to render even if model does not exist on remote yet
      this.model.fetch({
        complete: (function() {
          this.app.loader.done();
          this.render();
        }).bind(this)
      });
    } else {
      this.router.notify(
        t('notification.error.exists'),
        undefined,
        [
          {
            'title': t('notification.create'),
            'className': 'create',
            'link': '#'
          },
          {
            'title': t('notification.back'),
            'link': '#' + _.compact([
              this.repo.get('owner').login,
              this.repo.get('name'),
              'tree',
              this.branch,
              util.extractFilename(this.path)[0]
            ]).join('/')
          }
        ]
      );

      this.app.loader.done();
    }
  },

  newEmptyFile: function() {
    return new File({
      branch: this.branches.findWhere({ name: this.branch }),
      collection: this.collection,
      path: this.path,
      repo: this.repo
    });
  },

  nearestPath: function(path, defaults) {
    // Match nearest parent directory default metadata
    // Match paths in _drafts to corresponding defaults set at _posts
    path = path.replace(/^(_drafts)/, '_posts');
    var nearestDir = /\/?(?!.*\/).*$/;

    while (!_.has(defaults, path) && nearestDir.test(path) && path) {
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
          if (this.toolbar) this.toolbar.highlight();
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
    var results = content.match(scan);

    // Iterate over the results and replace
    _.each(results, (function(r) {
      var parts = (image).exec(r);
      var path;

      if (parts !== null) {
        path = parts[2];

        if (!util.absolutePath(path)) {
          // Remove any title attribute in the image tag is there is one.
          if (titleAttribute.test(path)) {
            path = path.split(titleAttribute)[0];
          }

          // Remove {{site.baseurl}}
          path = path.replace('{{site.baseurl}}/', '/');

          // Prepend directory path if not site root relative
          path = /^\//.test(path) ? path.slice(1) :
            util.extractFilename(this.model.get('path'))[0] + '/' + path;

          var url = auth.site + '/' + this.repo.get('owner').login + '/' + this.repo.get('name') + '/blob/' +  this.branch + '/' + window.escape(path) + '?raw=true';

          content = content.replace(r, '![' + parts[1] + '](' + url + ')');
        }
      }
    }).bind(this));

    return _.escape(content);
  },

  toggleEditor: function() {
    cookie.set('disableCSVEditor', !cookie.get('disableCSVEditor'))
    this.render();
  },

  parseCSV: function(csvString) {
    return Papa.parse(util.trim(csvString), {  // remove trailing whitespace, mholt/PapaParse#279
      skipEmptyLines: true
    });
  },

  initCSVEditor: function() {
    var self = this;

    var $container = this.$el.find('#csv');
    var container = $container[0];
    var data = this.parseCSV(this.model.get('content'))

    var distanceFromTop = $container.offset().top;
    var documentHeight = $(document).height();
    var editorHeight = documentHeight - distanceFromTop;

    this.editor = new Handsontable(container, {
      data: data.data,
      colHeaders: true,
      rowHeaders: true,
      stretchH: 'all',
      height: editorHeight,
      fixedRowsTop: 1,
      manualColumnResize: true,
      manualRowResize: true,
      contextMenu: ['row_above', 'row_below', 'col_left', 'col_right', 'remove_row', 'remove_col', 'undo', 'redo'],
      undo: true,
      afterChange: function(changes, source) {
        if (source !== 'loadData') self.makeDirty();
      }
    })

    this.editor.getValue = function() {
      return Papa.unparse(this.getSourceData());
    };

    this.editor.setValue = function(newValue) {
      var parsedValue = self.parseCSV(newValue);
      this.loadData(parsedValue.data);
      self.makeDirty();
    };

    // Check sessionStorage for existing stash
    // Apply if stash exists and is current, remove if expired
    this.stashApply();
  },

  initEditor: function() {
    var lang = this.model.get('lang');

    var code = this.$el.find('#code')[0];
    code.value = this.model.get('content') || '';
    // TODO: set default content for CodeMirror
    this.editor = CodeMirror.fromTextArea(code, {
      mode: lang,
      lineWrapping: true,
      lineNumbers: (lang === 'gfm' || lang === null) ? false : true,
      extraKeys: this.keyMap(),
      matchBrackets: true,
      dragDrop: false,
      theme: 'prose-bright'
    });

    // Bind Drag and Drop work on the editor
    if (this.model.get('markdown') && this.model.get('writable')) {
      upload.dragDrop(this.$el, (function(e, file, content) {
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
      this.listenTo(this.editor, 'cursorActivity', this.cursor);
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
    this.listenTo(this.toolbar, 'post', this.post);
  },

  titleAsHeading: function() {
    // If the file is Markdown, has metadata for a title,
    // the editable field in the header should be
    // the title of the Markdown document.
    var metadata = this.model.get('metadata');

    if (this.model.get('markdown')) {

      // 1. A title exists in a files current metadata
      if (metadata && metadata.title) {
        return metadata.title;

      // 2. A title does not exist and should be checked in the defaults
      } else if (this.model.get('defaults')) {

        var defaultTitle = _(this.model.get('defaults')).find(function(t) {
          return t.name == 'title';
        });

        if (defaultTitle) {
          if (defaultTitle.field && defaultTitle.field.value) {
            return defaultTitle.field.value;
          } else {

            // 3. If a title entry is in the defaults but with no
            // default value, use an untitled placeholder message.
            // return t('main.file.noTitle');
            return t('main.file.noTitle');
          }
        } else {
          return false;
        }
      } else {

        // This is not a Markdown post, bounce
        // TODO: Should this handle _posts/name.html?
        return false;
      }
    }
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

    this.listenTo(this.sidebar, 'makeDirty', this.makeDirty);

    // Commit message sidebar panel
    this.save = this.sidebar.initSubview('save', {
      sidebar: this.sidebar,
      file: this.model
    }).render();
    this.subviews['save'] = this.save;
  },

  initHeader: function() {
    var title = this.titleAsHeading();
    var input = title ?
      title :
      this.model.get('path');

    this.header = new HeaderView({
      input: input,
      title: title ? true : false,
      file: this.model,
      repo: this.repo,
      alterable: true,
      placeholder: this.model.isNew() && !this.model.translate && !this.model.isClone()
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
    this.app.loader.start();

    if (this.mode === 'preview') {
      this.preview();
    } else {
      var content = this.model.get('content');

      var file = {
        markdown: this.model.get('markdown'),
        lang: this.model.get('lang'),
        useCSVEditor: (['csv', 'tsv'].indexOf(this.model.get('lang')) !== -1 && !cookie.get('disableCSVEditor'))
      };

      this.$el.empty().append(_.template(this.template, file, {
        variable: 'file'
      }));

      // Store the configuration object from the collection
      this.config = this.model.get('collection').config;

      // initialize the subviews
      if (file.useCSVEditor) {
        this.initCSVEditor();
      } else {
        this.initEditor();
      }
      this.initHeader();
      this.initToolbar();
      this.initSidebar();

      var mode = ['file'];
      var markdown = this.model.get('markdown');
      var jekyll = /^(_posts|_drafts)/.test(this.model.get('path'));

      // Update the navigation view with menu options
      // if a file contains metadata, has default metadata or is Markdown (except CSVs)
      if (!file.useCSVEditor && (this.model.get('metadata') || this.model.get('defaults') || (markdown && jekyll))) {
        this.renderMetadata();

        mode.push('meta');
      }

      if (markdown || this.model.get('extension') === 'html') mode.push('preview');
      if (!this.model.isNew()) mode.push('settings');

      this.nav.mode(mode.join(' '));

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

        if (this.model.get('markdown')) {
          util.fixedScroll(this.$el.find('.topbar'), 90);
        }
      }

      if (this.mode === 'blob') {
        this.blob();
      }
    }

    this.app.loader.done();

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

      if (this.model.get('markdown')) {
        _.delay(function() {
          util.fixedScroll($('.topbar', view.el), 90);
        }, 1);
      }
    }

    $('#prose').toggleClass('open', false);

    this.contentMode('edit');
    this.mode = this.model.isNew() ? 'new' : 'edit';
    this.nav.setFileState(this.mode);
    this.updateURL();
  },

  blob: function(e) {
    this.sidebar.close();

    var metadata = this.model.get('metadata');
    var jekyll = this.config && this.config.siteurl && metadata && metadata.layout;

    if (jekyll && e) {
      // TODO: this could all be removed if preview button listened to
      // change:path event on model
      this.nav.setFileState('edit'); // Return to edit because we are creating a new window
      this.stashFile();

      var hash = this.absoluteFilepath().split('/');
      hash.splice(2, 0, 'preview');
      $(e.currentTarget).attr({
        target: '_blank',
        href: '#' + hash.join('/')
      });
    } else {
      if (e) e.preventDefault();

      this.$el.find('#preview').html(marked(this.compilePreview(this.model.get('content'))));

      this.mode = 'blob';
      this.contentMode('preview');
      this.nav.setFileState('blob');
      this.updateURL();
    }
  },

  preview: function() {
    var q = queue(1);
    // Retrieve the stash from the model path because thats what would
    // have been stored when the preview button is clicked
    var stash = this.getStashForPath(this.absolutePathFromFile(this.model));
    var metadata = {};
    var content = '';
    if (stash && stash.content) {
      metadata = stash.metadata;
      content = stash.content;
    } else {
      metadata = this.model.get('metadata') || {};
      content = this.model.get('content') || '';
    }

    // Run the liquid parsing.
    var parsedTemplate = Liquid.parse(this.compilePreview(content)).render({
      site: this.collection.config,
      post: metadata,
      page: metadata
    });

    // If it's markdown, run it through marked; otherwise, leave it alone.
    if(this.model.get('markdown'))  parsedTemplate = marked(parsedTemplate);

    var p = {
      site: this.collection.config,
      post: metadata,
      page: metadata,
      content: parsedTemplate || ''
    };

    // Grab a date from the filename
    // and add this post to be evaluated as {{post.date}}
    var parts = util.extractFilename(this.path)[1].split('-');
    var year = parts[0];
    var month = parts[1];
    var day = parts[2];

    // TODO: remove EST specific time adjustment
    var date = [year, month, day].join('-') + ' 05:00:00';

    try {
      p.post.date = jsyaml.safeLoad(date).toDateString();
    } catch(err) {
      console.log("Error parsing date");
      console.log(err);
    }

    // Parse JSONP links
    if (p.site && p.site.site) {
      _(p.site.site).each(function(file, key) {
        q.defer(function(cb){
          var next = false;
          $.ajax({
            cache: true,
            dataType: 'jsonp',
            jsonp: false,
            jsonpCallback: 'callback',
            url: file,
            timeout: 5000,
            success: function(d) {
              p.site[key] = d;
              next = true;
              cb();
            },
            error: function(msg, b, c) {
              if (!next) cb();
            }
          });
        });
      });
    }

    function getLayout(cb) {
      var file = p.page.layout;
      var layout = this.collection.findWhere({ path: '_layouts/' + file + '.html' });

      layout.fetch({
        success: (function(model, res, options) {
          model.getContent({
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
            }).bind(this),
            error: (function(model, xhr, options) {
              this.router.error(xhr);
            }).bind(this)
          });
        }).bind(this),
        error: (function(model, xhr, options) {
          this.router.error(xhr);
        }).bind(this)
      });
    }

    if (p.page.layout) {
      q.defer(getLayout.bind(this));
    }

    q.await((function() {
      var config = this.collection.config;
      var content = p.content;

      // Set base URL to public site
      if (config && config.siteurl) {
        content = content.replace(/(<head(?:.*)>)/, (function() {
          return arguments[1] + '<base href="' + config.siteurl + '">';
        }).bind(this));
      }

      document.write(content);
      document.close();
    }).bind(this));
  },

  contentMode: function(mode) {
    this.$el.find('.views .view').removeClass('active');
    if (mode) {
      this.$el.find('#' + mode).addClass('active');
    } else {
      if (this.mode === 'blob') {
        this.$el.find('#preview').addClass('active');
      } else {
        this.$el.find('#edit').addClass('active');
      }
    }
  },

  meta: function() {
    this.sidebar.close();
    this.contentMode('meta');

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
        error: (function(model, xhr, options) {
          this.router.error(xhr);
        }).bind(this)
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

    var label = this.model.get('writable') ?
      t('actions.change.save') :
      t('actions.change.submit');

    this.updateSaveState(label, 'save');
  },

  settings: function() {
    this.contentMode();
    this.sidebar.mode('settings');
    this.sidebar.open();
  },

  showDiff: function() {
    this.contentMode('diff');
    this.sidebar.mode('save');
    this.sidebar.open();

    var $diff = this.$el.find('#diff');

    // Use _.escape() to prevent rendering HTML tags
    var text1 = this.model.isNew() ? '' : _.escape(this.model.get('previous'));
    var text2 = _.escape(this.model.serialize());

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

    $diff.find('.diff-content').html('<pre>' + compare + '</pre>');
  },

  cancel: function() {
    // Close the sidebar and return the
    // active nav item to the current file mode.
    this.sidebar.close();
    this.nav.active(this.mode);

    // Return back to old mode.
    this.contentMode();
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
        var message = util.xhrErrorMessage(xhr);
        this.updateSaveState(message, 'error');
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

  absoluteFilepath: function() {
    return this.absolutePathFromComponents(
      this.repo.get('owner').login,
      this.repo.get('name'),
      this.branch,
      this.filepath()
    );
  },

  absolutePathFromFile: function(file) {
    return this.absolutePathFromComponents(
      file.collection.repo.get('owner').login,
      file.collection.repo.get('name'),
      file.collection.branch.get('name'),
      file.get('path')
    );
  },

  absolutePathFromComponents: function(user, repo, branch, path) {
    var url = _.compact([ user, repo, branch, path ]);
    return url.join('/');
  },

  draft: function() {
    var defaults = this.collection.defaults || {};
    var path = this.model.get('path').replace(/^(_posts)/, '_drafts');
    var url;

    // Create File model clone with metadata and content
    // Reassign this.model to clone and re-render
    this.model = this.collection.get(path) || this.model.clone({
      path: path
    });

    // Set default metadata for new path
    if (this.model && defaults) {
      this.model.set('defaults', defaults[this.nearestPath(path, defaults)]);
    }

    // Update view properties
    this.path = path;

    url = _.compact([
      this.repo.get('owner').login,
      this.repo.get('name'),
      this.mode,
      this.branch,
      this.path
    ]);

    this.router.navigate(url.join('/'), {
      trigger: false
    });

    this.sidebar.close();
    this.nav.active('edit');

    this.model.fetch({ complete: this.render });
  },

  post: function(e) {
    var defaults = this.collection.defaults || {};
    var metadata = this.model.get('metadata') || {};
    var content = this.model.get('content') || '';
    var path = this.model.get('path').replace(/^(_drafts)/, '_posts');
    var url;

    // Create File model clone with metadata and content
    // Reassign this.model to clone and re-render
    this.model = this.collection.get(path) || this.model.clone({
      path: path
    });

    // Set default metadata for new path
    if (this.model && defaults) {
      this.model.set('defaults', defaults[this.nearestPath(path, defaults)]);
    }

    // Update view properties
    this.path = path;

    url = _.compact([
      this.repo.get('owner').login,
      this.repo.get('name'),
      this.mode,
      this.branch,
      this.path
    ]);

    this.router.navigate(url.join('/'), {
      trigger: false
    });

    this.model.fetch({
      complete: (function(model, res, options) {
        // Set metadata and content from draft on post model
        this.model.set('metadata', metadata);
        this.model.set('content', content);

        this.render();

        this.nav.active('save');
        this.showDiff();
      }).bind(this)
    });
  },

  translate: function(e) {
    var defaults = this.collection.defaults || {};
    var metadata = this.model.get('metadata') || {};
    var lang = $(e.currentTarget).attr('href').substr(1);
    var path = this.model.get('path').split('/');
    var model;
    var url;

    // TODO: Drop the 'en' requirement.
    if (lang === 'en') {
      // If current page is not english and target page is english
      path.splice(-2, 2, path[path.length - 1]);
    } else if (metadata.lang === 'en') {
      // If current page is english and target page is not english
      path.splice(-1, 1, lang, path[path.length - 1]);
    } else {
      // If current page is not english and target page is not english
      path.splice(-2, 2, lang, path[path.length - 1]);
    }

    path = _.compact(path).join('/');

    var categories = (metadata.categories || []);
    categories.unshift(lang);

    this.model = this.collection.get(path) || this.model.clone({
      metadata: {
        categories: categories,
        lang: lang
      },
      path: path
    });

    // Set default metadata for new path
    if (this.model && defaults) {
      this.model.set('defaults', defaults[this.nearestPath(path, defaults)]);
    }

    // Update view properties
    this.path = path;

    url = _.compact([
      this.repo.get('owner').login,
      this.repo.get('name'),
      this.mode,
      this.branch,
      this.path
    ]);

    this.router.navigate(url.join('/'), {
      trigger: false
    });

    this.sidebar.close();
    this.model.fetch({ complete: this.render });
  },

  stashFile: function(e) {
    if (e) e.preventDefault();
    if (!window.sessionStorage) return false;

    var store = window.sessionStorage;
    var filepath = this.absoluteFilepath();
    // Don't stash if filepath is undefined
    if (filepath) {
      try {
        store.setItem(filepath, JSON.stringify({
          sha: this.model.get('sha'),
          content: this.editor ? this.editor.getValue() : null,
          metadata: this.metadataEditor ? this.metadataEditor.getValue() : null
        }));
      } catch (err) {
        console.log(err);
      }
    }
  },

  stashApply: function() {
    var filepath = this.absolutePathFromFile(this.model);
    var stash = this.getStashForPath(filepath);
    if (!stash) return false;
    if (stash.sha === this.model.get('sha')) {
      // Restore from stash if file sha hasn't changed
      if (this.editor && this.editor.setValue) this.editor.setValue(stash.content);
      if (this.metadataEditor) {
        // this.rawEditor.setValue('');
        this.metadataEditor.setValue(stash.metadata);
      }
    } else {
      // Remove expired content
      this.clearStashForPath(filepath);
    }
  },

  getStashForPath: function(filepath) {
    if (!window.sessionStorage) return false;
    var store = window.sessionStorage;
    var item = store.getItem(filepath);
    return JSON.parse(item);
  },

  clearStashForPath: function(filepath) {
    if (!window.sessionStorage) return;
    var store = window.sessionStorage;
    store.removeItem(filepath);
  },

  updateFile: function() {
    var view = this;

    // Trigger the save event
    this.updateSaveState(t('actions.save.saving'), 'saving');

    var method = this.model.get('writable') ? this.model.save : this.patch;

    //this.updateSaveState(t('actions.save.metaError'), 'error');
    //this.updateSaveState(t('actions.error'), 'error');
    //this.updateSaveState(t('actions.save.saved'), 'saved', true);
    //this.updateSaveState(t('actions.save.fileNameError'), 'error');

    // Validation checking
    this.model.on('invalid', (function(model, error) {
      this.updateSaveState(error, 'error');

      view.modal = new ModalView({
        message: error
      });

      view.$el.find('#modal').html(view.modal.el);
      view.modal.render();
    }).bind(this));

    // Update content
    this.model.content = (this.editor) ? this.editor.getValue() : '';

    // Delegate
    method.call(this, {
      success: (function(model, res, options) {
        var url;
        var data;
        var params;

        this.sidebar.close();
        this.updateSaveState(t('actions.save.saved'), 'saved');

        // Enable settings sidebar item
        this.nav.$el.addClass('settings');

        // Update current path
        var path = model.get('path');
        this.path = path;

        // Unset dirty, return to edit view
        this.dirty = false;
        this.edit();

        var old = model.get('oldpath');
        var name = util.extractFilename(old)[1];
        var pathChange = path !== old;

        // Remove old file if renamed
        // TODO: remove this when Repo Contents API supports renaming
        if (model.previous('sha') && pathChange) {
          url = model.url().replace(path, old).split('?')[0];

          data = {
            path: old,
            message: t('actions.commits.deleted', { filename: name }),
            sha: model.previous('sha'),
            branch: this.collection.branch.get('name')
          };

          params = _.map(_.pairs(data), function(param) {
            return param.join('=');
          }).join('&');

          $.ajax({
            type: 'DELETE',
            url: url + '?' + params,
            error: (function(xhr, textStatus, errorThrown) {
              var message = util.xhrErrorMessage(xhr);
              this.updateSaveState(message, 'error');
            }).bind(this),

            // Update oldpath so that if the file is renamed more than once, we
            // don't end up with multiple copies of it
            success: function() {
              model.set('oldpath', path);
            }

          });
        }
        else if (pathChange) {
          // Update oldpath so that if the file is renamed more than once, we
          // don't end up with multiple copies of it
          model.set('oldpath', path);
        }
      }).bind(this),
      error: (function(model, xhr, options) {
        var message = util.xhrErrorMessage(xhr);
        this.updateSaveState(message, 'error');
      }).bind(this)
    });

    return false;
  },

  updateSaveState: function(label, classes, kill) {
    // Cancel if this condition is met
    if (classes === 'save' && $(this.el).hasClass('saving')) return;

    // Update the Sidebar save button
    if (this.sidebar) this.sidebar.updateState(label);

    // Update the avatar in the toolbar
    if (this.nav) this.nav.updateState(label, classes, kill);
  },

  updateImageInsert: function(e, file, content) {
    var path = (this.toolbar.mediaDirectoryPath) ?
                    this.toolbar.mediaDirectoryPath :
                    util.extractFilename(this.toolbar.file.attributes.path)[0];
    var src = path + '/' + encodeURIComponent(file.name);

    this.$el.find('input[name="url"]').val(src);
    this.$el.find('input[name="alt"]').val('');

    this.toolbar.queue = {
      e: e,
      file: file,
      content: content
    };
  },

  defaultUploadPath: function(fileName) {
    // Default to media directory if defined in config,
    // current directory if no path specified
    var dir = (this.config && this.config.media) ? this.config.media :
      util.extractFilename(this.model.get('path'))[0];

    return _.compact([dir, fileName]).join('/');
  },

  upload: function(e, file, content, path) {
    // Loading State
    this.updateSaveState(t('actions.upload.uploading', { file: file.name }), 'saving');

    var uploadPath = path || this.defaultUploadPath(file.name);
    this.collection.upload(file, content, uploadPath, {
      success: (function(model, res, options) {
        var name = res.content.name;
        var path = '{{site.baseurl}}/' + res.content.path;

        // Take the alt text from the insert image box on the toolbar
        var $alt = $('input[name="alt"]');
        var value = $alt.val();
        var image = (value) ?
          '![' + value + '](' + path + ')' :
          '![' + name + '](' + path + ')';

        this.editor.focus();
        this.editor.replaceSelection(image + '\n', 'end');
        this.updateSaveState('Saved', 'saved', true);
      }).bind(this),
      error: (function(model, xhr, options) {
        var message = util.xhrErrorMessage(xhr);
        this.updateSaveState(message, 'error');
      }).bind(this)
    });
  },

  remove: function() {
    // Unbind beforeunload prompt
    window.onbeforeunload = null;

    // Reset dirty models on navigation
    if (this.dirty) {
      this.stashFile();
      this.model.fetch();
    }

    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    // Clear any file state classes in #prose
    this.updateSaveState('', '');

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
