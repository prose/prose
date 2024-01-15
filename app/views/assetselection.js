var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var upload = require('../upload');
var templates = require('../../dist/templates');
var util = require('../util');

module.exports = Backbone.View.extend({
  template: templates.dialogs.media,

  events: {
    'change .upload': 'fileInput',
  },

  initialize: function(options) {
    this.assets = options.assets;
    this.ancestor = options.ancestor;
    this.model = options.model;
    this.includeAltText = options.includeAltText;
    this.onInsert = options.onInsert;
    this.defaultUploadPath = options.view.defaultUploadPath;
    this.render();
  },

  render: function() {
    $(this.el).html($(_.template(this.template, {
      description: t('dialogs.media.description', {
        input: '<input class="upload" type="file" />'
      }),
      includeMediaDirectory: this.assets && this.assets.length,
      isWritable: this.model.get('writable'),
      includeAltText: this.includeAltText
    })));
    var self = this;

    // Construct the media assets list
    if (this.assets && this.assets.length) {
      var $media = this.$el.find('.mediaDirectory');
      var tmpl = _(templates.dialogs.mediadirectory).template();
      this.assets.each(function(asset) {
        var parts = asset.get('path').split('/');
        var path = '/' + parts.slice(0, parts.length - 1).join('/');

        $media.append(tmpl({
          name: asset.get('name'),
          type: asset.get('type'),
          path: path + '/' + encodeURIComponent(asset.get('name')),
          isMedia: util.isMedia(asset.get('name').split('.').pop())
        }));
      });

      $('.asset a', $media).on('click', function(e) {
        var href = $(this).attr('href');
        var alt = util.trim($(this).text());
        $(self.el).find('input[name="url"]').val(href);
        $(self.el).find('input[name="alt"]').val(alt);
        return false;
      });
    }

    $(this.el).find(".insert").click(this.onInsert);
    return this.$el;
  },

  fileInput: function(e) {
    var $dialog = $(e.target).closest('div.dialog.media');
    var self = this;
    upload.fileSelect(e, function(e, file, content) {
      self.updateImageInsert(e, file, content, self.ancestor, $dialog);
    });

    return false;
  },

  updateImageInsert: function(e, file, content, target, $dialog) {
    $dialog.find('input[name="url"]').val(this.defaultUploadPath(file.name));
    $dialog.find('input[name="alt"]').val('');

    target.queue = {
      e: e,
      file: file,
      content: content
    };
    return false;
  },

});