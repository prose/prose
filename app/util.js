var $ = require('jquery-browserify');
var _ = require('underscore');
var chrono = require('chrono');

module.exports = {

  // Extract filename from a given path
  // -------
  //
  // this.extractFilename('path/to/foo.md')
  // => ['path/to', 'foo.md']

  extractFilename: _.memoize(function(path) {
    if (!path.match(/\//)) return ['', path];
    var matches = path.match(/(.*)\/(.*)$/);
    return [matches[1], matches[2]];
  }),

  validPathname: _.memoize(function(path) {
    var self = this;
    return _.all(path.split('/'), function(filename) {
      return !!filename.match(/^([a-zA-Z0-9_\-]|\.)+$/);
    });
  }),

  parentPath: function(path) {
    return path.replace(/\/?[a-zA-Z0-9_\-]*$/, '');
  },

  // Extract parts of the path
  // into a state from the router
  // -------

  extractURL: _.memoize(function(url) {
    url = url.split('/');
    app.state.mode = url[0];
    app.state.branch = url[1];
    app.state.path = (url.slice(2) || []).join('/');
    return app.state;
  }),

  // Determine mode for CodeMirror
  // -------

  mode: _.memoize(function(extension) {
    if (this.isMarkdown(extension)) return 'gfm';
    if (_.include(['js', 'json'], extension)) return 'javascript';
    if (extension === 'html') return 'htmlmixed';
    if (extension === 'rb') return 'ruby';
    if (/(yml|yaml)/.test(extension)) return 'yaml';
    if (_.include(['java', 'c', 'cpp', 'cs', 'php'], extension)) return 'clike';

    return extension;
  }),

  // Check if a given file is a Jekyll post
  // -------

  jekyll: _.memoize(function(path, file) {
    return !!(path.match('_posts') && this.markdown(file));
  }),

  // Check if a given file has YAML frontmater
  // -------

  hasMetadata: _.memoize(function(content) {
    content = content.replace(/\r\n/g, '\n'); // normalize a little bit
    return content.match( /^(---\n)((.|\n)*?)\n---\n?/ );
  }),

  // Extract file extension
  // -------

  extension: _.memoize(function(file) {
    var match = file.match(/\.(\w+)$/);
    return match ? match[1] : null;
  }),

  // Does the root of the path === _drafts?
  // -------

  draft: _.memoize(function(path) {
    return (path.split('/')[0] === '_drafts') ? true : false
  }),

  // Determine types
  // -------

  markdown: _.memoize(function(file) {
    var regex = new RegExp(/.(md|mkdn?|mdown|markdown)$/);
    return !!(regex.test(file));
  }),

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

  chunkedPath: _.memoize(function(path) {
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
  }),

  isBinary: _.memoize(function(extension) {
    var regex = new RegExp(/^(jpeg|jpg|gif|png|ico|eot|ttf|woff|otf|zip|swf|mov|dbf|index|prj|shp|shx|DS_Store|crx|glyphs)$/);
    return !!(regex.test(extension));
  }),

  isMarkdown: function(extension) {
    var regex = new RegExp(/^(md|mkdn?|mdown|markdown)$/);
    return !!(regex.test(extension));
  },

  isMedia: _.memoize(function(extension) {
    var regex = new RegExp(/^(jpeg|jpg|gif|png|swf|mov)$/);
    return !!(regex.test(extension));
  }),

  isImage: _.memoize(function(extension) {
    var regex = new RegExp(/^(jpeg|jpg|gif|png)$/);
    return !!(regex.test(extension));
  }),

  // Return a true or false boolean if a path
  // a absolute or not.
  // -------

  absolutePath: _.memoize(function(path) {
    return /^https?:\/\//i.test(path);
  }),

  // Concatenate path + file to full filepath
  // -------

  filepath: _.memoize(function(path, file) {
    return (path ? path + '/' : '') + file;
  }),

  // Returns a filename without the file extension
  // -------

  filename: _.memoize(function(file) {
    return file.replace(/\.[^\/.]+$/, '');
  }),

  // String Manipulations
  // -------
  trim: _.memoize(function(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  }),

  lTrim: _.memoize(function(str) {
    return str.replace(/^\s\s*/, '');
  }),

  // UI Stuff
  // -------

  fixedScroll: function($el) {
    var top = $el.offset().top;

    $(window).scroll(function (e) {
      var y = $(this).scrollTop();
      if (y >= top) {
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
          offset = $prev.height() + 60;

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
        offset = $next.height() + 60;

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

  loader: {
    loading: function(message) {
      var tmpl = _(window.app.templates.loading).template();
      $('#loader').empty().append(tmpl({
        message: message
      }));
    },

    loaded: function() {
      $('#loader').find('.loading').fadeOut(150, function() {
        $(this).remove();
      });
    }
  },

  autoSelect: function($el) {
    $el.on('click', function() {
      $el.select();
    });
  }
};
