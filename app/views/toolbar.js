var $ = require('jquery-browserify');
var chosen = require('chosen-jquery-browserify');
var _ = require('underscore');
var util = require('../util');
var Backbone = require('backbone');
var toolbar = require('../toolbar/markdown.js');
var upload = require('../upload');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.toolbar,

  events: {
    'click .group a': 'markdownSnippet',
    'click .publish-flag': 'togglePublishing',
    'change #upload': 'fileInput',
    'click .dialog .insert': 'dialogInsert',
    'click .draft-to-post': 'post'
  },

  initialize: function(options) {
    var self = this;
    this.file = options.file;
    this.view = options.view;
    this.collection = options.collection;
    var config = options.config;

    if (config) {
      this.hasMedia = (config.media) ? true : false;
      this.siteUrl = (config.siteUrl) ? true : false;

      if (config.media) {
        // Fetch the media directory to display its contents
        this.mediaDirectoryPath = config.media;
        var match = new RegExp('^' + this.mediaDirectoryPath);

        this.media = this.collection.filter(function(m) {
          var path = m.get('path');

          return m.get('type') === 'file' && match.test(path) &&
            (util.isBinary(path) || util.isImage(m.get('extension')));
        });
      }

      if (config.relativeLinks) {
        $.ajax({
          cache: true,
          dataType: 'jsonp',
          jsonp: false,
          jsonpCallback: config.relativeLinks.split('?callback=')[1] || 'callback',
          url: config.relativeLinks,
          success: function(links) {
            self.relativeLinks = links;
          }
        });
      }
    }
  },

  render: function() {
    var toolbar = {
      markdown: this.file.get('markdown'),
      writable: this.file.get('writable'),
      lang: this.file.get('lang'),
      draft: this.file.get('draft'),
      metadata: this.file.get('metadata')
    };

    this.$el.html(_.template(this.template, toolbar, { variable: 'toolbar' }));

    return this;
  },

  fileInput: function(e) {
    var view = this;
    upload.fileSelect(e, function(e, file, content) {
      var path = (view.mediaDirectoryPath) ? view.mediaDirectoryPath : util.extractFilename(view.file.attributes.path)[0];
      var src = path + '/' + encodeURIComponent(file.name);

      view.$el.find('input[name="url"]').val(src);
      view.$el.find('input[name="alt"]').val('');
      view.trigger('updateImageInsert', e);
    });

    return false;
  },

  highlight: function(type) {
    this.$el.find('.group a').removeClass('active');
    if (arguments) this.$el.find('[data-key="' + type + '"]').addClass('active');
  },

  post: function(e) {
    if (e) e.preventDefault();
    this.trigger('post', e);
  },

  markdownSnippet: function(e) {
    var self = this;
    var $target = $(e.target).closest('a');
    var $dialog = this.$el.find('#dialog');
    var $snippets = this.$el.find('.group a');
    var key = $target.data('key');
    var snippet = $target.data('snippet');
    var selection = util.trim(this.view.editor.getSelection());

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
          this.view.editor.replaceSelection(snippet);
          break;
        }
        this.view.editor.focus();
      } else {
        this.view.editor.replaceSelection(snippet);
        this.view.editor.focus();
      }
    } else if ($target.data('dialog')) {

      var tmpl, className;
      if (key === 'media' && !this.mediaDirectoryPath ||
          key === 'media' && !this.media.length) {
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
            tmpl = _(templates.dialogs.link).template();

            $dialog.append(tmpl({
              relativeLinks: self.relativeLinks
            }));

            if (self.relativeLinks) {
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

                  // TODO: could be improved
                  title = parts[2].match(quoted)[0].replace(/"/g, '');
                }
              }

              $('input[name=text]', $dialog).val(text);
              if (href) $('input[name=href]', $dialog).val(href);
              if (title) $('input[name=title]', $dialog).val(title);
            }
          break;
          case 'media':
            tmpl = _(templates.dialogs.media).template();
            $dialog.append(tmpl({
              description: t('dialogs.media.description', {
                input: '<input id="upload" class="upload" type="file" />'
              }),
              assetsDirectory: (self.media && self.media.length) ? true : false,
              writable: self.file.get('writable')
            }));

            if (self.media && self.media.length) self.renderMedia(self.media);

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
            tmpl = _(templates.dialogs.help).template();
            $dialog.append(tmpl({
              help: toolbar.help
            }));

            // Page through different help sections
            var $mainMenu = this.$el.find('.main-menu a');
            var $subMenu = this.$el.find('.sub-menu');
            var $content = this.$el.find('.help-content');

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

  publishState: function() {
    if (this.$el.find('publish-state') === 'true') {
      return true;
    } else {
      return false;
    }
  },

  updatePublishState: function() {
    // Update the publish key wording depening on what was saved
    var $publishkey = this.$el.find('.publish-flag');
    var key = $publishKey.attr('data-state');

    if (key === 'true') {
      $publishKey.html(t('actions.publishing.published') +
                      '<span class="ico small checkmark"></span>');
    } else {
      $publishKey.html(t('actions.publishing.unpublished') +
                      '<span class="ico small checkmark"></span>');
    }
  },

  togglePublishing: function(e) {
    var $target = $(e.currentTarget);
    var metadata = this.file.get('metadata');
    var published = metadata.published;

    // TODO: remove HTML from view
    // Toggling publish state when the current file is published live
    if (published) {
      if ($target.hasClass('published')) {
        $target
          .empty()
          .append(t('actions.publishing.unpublish') +
                '<span class="ico small checkmark"></span>' +
                '<span class="popup round arrow-top">' +
                t('actions.publishing.unpublishInfo') +
                '</span>')
          .removeClass('published')
          .attr('data-state', false);
      } else {
        $target
          .empty()
          .append(t('actions.publishing.published') +
                '<span class="ico small checkmark"></span>')
          .addClass('published')
          .attr('data-state', true);
      }
    } else {
      if ($target.hasClass('published')) {
        $target
          .empty()
          .append(t('actions.publishing.unpublished') +
                '<span class="ico small checkmark"></span>')
          .removeClass('published')
          .attr('data-state', false);
      } else {
        $target
          .empty()
          .append(t('actions.publishing.publish') +
                '<span class="ico small checkmark"></span>' +
                '<span class="popup round arrow-top">' +
                t('actions.publishing.publishInfo') +
                '</span>')
          .addClass('published')
          .attr('data-state', true);
      }
    }

    this.file.set('metadata', _.extend(metadata, {
      published: !published
    }));

    this.view.makeDirty();
    return false;
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
        this.view.editor.replaceSelection('[' + text + '](' + href + ' "' + title + '")');
      } else {
        this.view.editor.replaceSelection('[' + text + '](' + href + ')');
      }

      this.view.editor.focus();
    }

    if (type === 'media') {
      if (this.queue) {
        var userDefinedPath = $('input[name="url"]').val();
        this.view.upload(this.queue.e, this.queue.file, this.queue.content, userDefinedPath);

        // Finally, clear the queue object
        this.queue = undefined;
      } else {
        var src = $('input[name="url"]').val();
        var alt = $('input[name="alt"]').val();
        this.view.editor.replaceSelection('![' + alt + '](/' + src + ')');
        this.view.editor.focus();
      }
    }

    return false;
  },

  heading: function(s) {
    if (s.charAt(0) === '#' && s.charAt(2) !== '#') {
      this.view.editor.replaceSelection(util.lTrim(s.replace(/#/g, '')));
    } else {
      this.view.editor.replaceSelection('## ' + s.replace(/#/g, ''));
    }
  },

  subHeading: function(s) {
    if (s.charAt(0) === '#' && s.charAt(3) !== '#') {
      this.view.editor.replaceSelection(util.lTrim(s.replace(/#/g, '')));
    } else {
      this.view.editor.replaceSelection('### ' + s.replace(/#/g, ''));
    }
  },

  italic: function(s) {
    if (s.charAt(0) === '_' && s.charAt(s.length - 1 === '_')) {
      this.view.editor.replaceSelection(s.replace(/_/g, ''));
    } else {
      this.view.editor.replaceSelection('_' + s.replace(/_/g, '') + '_');
    }
  },

  bold: function(s) {
    if (s.charAt(0) === '*' && s.charAt(s.length - 1 === '*')) {
      this.view.editor.replaceSelection(s.replace(/\*/g, ''));
    } else {
      this.view.editor.replaceSelection('**' + s.replace(/\*/g, '') + '**');
    }
  },

  quote: function(s) {
    if (s.charAt(0) === '>') {
      this.view.editor.replaceSelection(util.lTrim(s.replace(/\>/g, '')));
    } else {
      this.view.editor.replaceSelection('> ' + s.replace(/\>/g, ''));
    }
  },

  renderMedia: function(data, back) {
    var self = this;
    var $media = this.$el.find('#media');
    var tmpl = _(templates.dialogs.mediadirectory).template();

    // Reset some stuff
    $media.empty();

    if (back && (back.join() !== this.assetsDirectory)) {
      var link = back.slice(0, back.length - 1).join('/');
      $media.append('<li class="directory back"><a href="' + link + '"><span class="ico fl small inline back"></span>Back</a></li>');
    }

    data.each(function(d) {
      var parts = d.get('path').split('/');
      var path = parts.slice(0, parts.length - 1).join('/');

      $media.append(tmpl({
        name: d.get('name'),
        type: d.get('type'),
        path: path + '/' + encodeURIComponent(d.get('name')),
        isMedia: util.isMedia(d.get('name').split('.').pop())
      }));
    });

    $('.asset a', $media).on('click', function(e) {
      var href = $(this).attr('href');
      var alt = util.trim($(this).text());

      if (util.isImage(href.split('.').pop())) {
        self.$el.find('input[name="url"]').val(href);
        self.$el.find('input[name="alt"]').val(alt);
      } else {
        self.view.editor.replaceSelection(href);
        self.view.editor.focus();
      }
      return false;
    });
  }
});
