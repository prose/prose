var $ = require('jquery-browserify');
var _ = require('underscore');
var templates = require('../dist/templates');
var chrono = require('chrono');

module.exports = {

  // Cleans up a string for use in urls
  stringToUrl: function(string) {
    // Change non-alphanumeric characters to dashes, trim excess dashes
    return string.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-*$/, '');
  },

  // Extract a Jekyll date format from a filename
  extractDate: function(string) {
    var match = string.match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : '';
  },

  // Extract filename from a given path
  // -------
  //
  // this.extractFilename('path/to/foo.md')
  // => ['path/to', 'foo.md']

  extractFilename: function(path) {
    var regex = /\//;
    if (!regex.test(path)) return ['', path];
    var matches = path.match(/(.*)\/(.*)$/);
    return [matches[1], matches[2]];
  },

  validPathname: function(path) {
    var regex = /^([a-zA-Z0-9_\-]|\.)+$/;
    return _.all(path.split('/'), function(filename) {
      return !!regex.test(filename);
    });
  },

  parentPath: function(path) {
    return path.replace(/\/?[a-zA-Z0-9_\-]*$/, '');
  },

  // Extract parts of the path
  // into a state from the router
  // -------

  extractURL: function(url) {
    url = url.split('/');

    return {
      mode: url[0],
      branch: url[1],
      path: (url.slice(2) || []).join('/')
    };
  },

  // Determine mode for CodeMirror
  // -------

  mode: function(extension) {
    if (this.isMarkdown(extension)) return 'gfm';
    if (_.include(['js', 'json'], extension)) return 'javascript';
    if (extension === 'html') return 'htmlmixed';
    if (extension === 'rb') return 'ruby';
    if (/(yml|yaml)/.test(extension)) return 'yaml';
    if (_.include(['java', 'c', 'cpp', 'cs', 'php'], extension)) return 'clike';

    return extension;
  },

  // Check if a given file has YAML frontmater
  // -------

  hasMetadata: function(content) {
    var regex = /^(---\n)((.|\n)*?)\n---\n?/;
    content = content.replace(/\r\n/g, '\n'); // normalize a little bit
    return regex.test(content);
  },

  // Extract file extension
  // -------

  extension: function(file) {
    var match = file.match(/\.(\w+)$/);
    return match ? match[1] : null;
  },

  // Does the root of the path === _drafts?
  // -------

  draft: function(path) {
    return (path.split('/')[0] === '_drafts') ? true : false
  },

  // Determine types
  // -------

  markdown: function(file) {
    var regex = new RegExp(/.(md|mkdn?|mdown|markdown)$/);
    return !!(regex.test(file));
  },

  // chunked path
  // -------
  //
  // this.chunkedPath('path/to/foo')
  // =>
  // [
  //   { url: 'path',        name: 'path' },
  //   { url: 'path/to',     name: 'to' },
  //   { url: 'path/to/foo', name: 'foo' }
  // ]

  chunkedPath: function(path) {
    var chunks = path.split('/');
    return _.map(chunks, function(chunk, index) {
      var url = [];
      for (var i = 0; i <= index; i++) {
        url.push(chunks[i]);
      }
      return {
        url: url.join('/'),
        name: chunk
      };
    });
  },

  isBinary: function(path) {
    var regex = new RegExp(/.(jpeg|jpg|gif|png|ico|eot|ttf|woff|otf|zip|swf|mov|dbf|index|prj|shp|shx|DS_Store|crx|glyphs)$/);
    return !!(regex.test(path));
  },

  isMarkdown: function(extension) {
    var regex = new RegExp(/^(md|mkdn?|mdown|markdown)$/);
    return !!(regex.test(extension));
  },

  isMedia: function(extension) {
    var regex = new RegExp(/^(jpeg|jpg|gif|png|swf|mov)$/);
    return !!(regex.test(extension));
  },

  isImage: function(extension) {
    var regex = new RegExp(/^(jpeg|jpg|gif|png)$/);
    return !!(regex.test(extension));
  },

  // Return a true or false boolean if a path
  // a absolute or not.
  // -------

  absolutePath: function(path) {
    return /^https?:\/\//i.test(path);
  },

  // Concatenate path + file to full filepath
  // -------

  filepath: function(path, file) {
    return (path ? path + '/' : '') + file;
  },

  // Returns a filename without the file extension
  // -------

  filename: function(file) {
    return file.replace(/\.[^\/.]+$/, '');
  },

  // String Manipulations
  // -------
  trim: function(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  },

  lTrim: function(str) {
    return str.replace(/^\s\s*/, '');
  },

  // UI Stuff
  // -------

  documentTitle: function(title) {
    document.title = title + ' · Prose';
  },

  fixedScroll: function($el, offset) {
    $(window).scroll(function(e) {
      var y = $(this).scrollTop();
      if (y >= offset) {
        $el.addClass('fixed');
      } else {
        $el.removeClass('fixed');
      }
    });
  },

  pageListing: function(handler) {
    if ($('.item').hasClass('active')) {
      var index = parseInt($('.item.active').data('index'), 10);
      var offset;

      $('.item.active').removeClass('active');

      function inView(el) {
          var curTop = el.offset().top;
          var screenHeight = $(window).height();
          return (curTop > screenHeight) ? false : true;
      }

      // UP
      if (handler === 'k') {
        if (index !== 0) --index;
        var $prev = $('.item[data-index=' + index + ']');
        var prevTop = $prev.offset().top + $prev.height();

        if (!inView($prev)) {
          // Offset is the list height minus the difference between the
          // height and .content-search (60) that is fixed down the page
          offset = $prev.height();

          $('html, body').animate({
            scrollTop: $prev.offset().top + ($prev.height() - offset)
          }, 0);
        } else {
          $('html, body').animate({
            scrollTop: 0
          }, 0);
        }

        $prev.addClass('active');

      // DOWN
      } else {
        if (index < $('#content li').length - 1) ++index;
        var $next = $('.item[data-index=' + index + ']');
        var nextTop = $next.offset().top + $next.height();
        offset = $next.height();

        if (!inView($next)) {
          $('html, body').animate({
             scrollTop: $next.offset().top + ($next.height() - offset)
          }, 0);
        }

        $next.addClass('active');
      }
    } else {
      $('.item[data-index=0]').addClass('active');
    }
  },

  goToFile: function() {
    var path = $('.item.active').data('navigate');
    if (path) router.navigate(path, true);
    return false;
  },

  autoSelect: function($el) {
    $el.on('click', function() {
      $el.select();
    });
  }
};
