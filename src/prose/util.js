var $ = require('jquery-browserify');
var _ = require('underscore');
var jsyaml = require('js-yaml');
var marked = require('marked');
var queue = require('queue-async');
var chrono = require('chrono');

// Run an array of functions in serial
// -------

_.serial = function () {
  (_(arguments).reduceRight(_.wrap, function() {}))();
};


// Parent path
// -------

_.parentPath = function(path) {
  return path.replace(/\/?[a-zA-Z0-9_\-]*$/, '');
};


// Topmost path
// -------

_.topPath = function(path) {
  var match = path.match(/\/?([a-zA-Z0-9_\-]*)$/);
  return match[1];
};


// Valid filename check
// -------

_.validFilename = function(filename) {
  return !!filename.match(/^([a-zA-Z0-9_\-]|\.)+$/);
  // Disabled for now: the Jekyll post format layout
  // return !!filename.match(/^\d{4}-\d{2}-\d{2}-[a-zA-Z0-9_-]+\.md$/);
};


// Valid pathname check
// -------

_.validPathname = function(path) {
  return _.all(path.split('/'), function(filename) {
    return _.validFilename(filename);
  });
};


// Extract filename from a given path
// -------
//
// _.extractFilename('path/to/foo.md')
// => ['path/to', 'foo.md']

_.extractFilename = function(path) {
  if (!path.match(/\//)) return ['', path];
  var matches = path.match(/(.*)\/(.*)$/);
  return [ matches[1], matches[2] ];
};


// Extract parts of the path
// into a state from the router
// -------

_.extractURL = function(url) {
  url = url.split('/');
  app.state.mode = url[0];
  app.state.branch = url[1];
  app.state.path = (url.slice(2) || []).join('/');
  return app.state;
};

// Determine mode for CodeMirror
// -------

_.mode = function(file) {
  if (_.markdown(file)) return 'gfm';
  var extension = _.extension(file);

  if (_.include(['js', 'json'], extension)) return 'javascript';
  if (extension === 'html') return 'htmlmixed';
  if (extension === 'rb') return 'ruby';
  if (/(yml|yaml)/.test(extension)) return 'yaml';
  if (_.include(['java', 'c', 'cpp', 'cs', 'php'], extension)) return 'clike';

  return extension;
};


// Check if a given file is a Jekyll post
// -------

_.jekyll = function(path, file) {
  return !!(path.match('_posts') && _.markdown(file));
};

// check if a given file has YAML frontmater
// -------

_.hasMetadata = function(content) {
  content = content.replace(/\r\n/g, '\n'); // normalize a little bit
  return content.match( /^(---\n)((.|\n)*?)\n---\n?/ );
};

// Extract file extension
// -------

_.extension = function(file) {
  var match = file.match(/\.(\w+)$/);
  return match ? match[1] : null;
};


// Determine types
// -------

_.markdown = function(file) {
  var regex = new RegExp(/.(md|mkdn?|mdown|markdown)$/);
  return !!(regex.test(file));
};

_.isBinary = function(file) {
  var regex = new RegExp(/(jpeg|jpg|gif|png|ico|eot|ttf|woff|otf|zip|swf|mov|dbf|index|prj|shp|shx|DS_Store|crx|glyphs)$/);
  return regex.test(file);
};

_.isMedia = function(file) {
  var regex = new RegExp(/(jpeg|jpg|gif|png|swf|mov)$/);
  return regex.test(file);
};

_.isImage = function(file) {
  var regex = new RegExp(/(jpeg|jpg|gif|png)$/);
  return regex.test(file);
};

// Returns a filename without the file extension
// -------

_.filename = function(file) {
  return file.replace(/\.[^\/.]+$/, '');
};

// String Manipulations
// -------
_.trim = function(str) {
  return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};

_.rTrim = function(str) {
  return str.replace(/\s\s*$/, '');
};

_.lTrim = function(str) {
  return str.replace(/^\s\s*/, '');
};

// Concatenate path + file to full filepath
// -------

_.filepath = function(path, file) {
  return (path ? path + '/' : '') + file;
};


// Return a true or false boolean if a path
// a absolute or not.
// -------

_.absolutePath = function(path) {
  return /^https?:\/\//i.test(path);
};

// Converts a javascript object to YAML
// Does not support nested objects
// Multiline values are serialized as Blocks

_.toYAML = function(metadata) {
  var res = [];
  _.each(metadata, function(value, property) {
    if (value.match(/\n/)) {
      var str = property+': |\n';

      _.each(value.split('\n'), function(line) {
        str += '  ' + line;
      });

      res.push();
    } else {
      res.push(property + ': ' + value);
    }
  });

  return res.join('\n');
};


// Only parses first level of YAML file
// Considers the whole thing as a key-value pair party
//
// name: "michael"
// age: 25
// friends:
// - Michael
// - John
// block: |
//   Hello World
//   Another line
//   24123
//
// =>
// {
//   name: 'michael',
//   age: "25",
//   friends: "- Michael\n- John",
//   block: "Hello World\nAnother line\n24123"
// }
//
// var yaml = 'name:     "michael"\nage: 25\nfriends:\n- Michael\n- John\nblock: |\n  hey ho\n  some text\n  yay';
// console.log(_.fromYAML(yaml));

_.fromYAML = function(rawYAML) {
  var data = {};

  var lines = rawYAML.split('\n');
  var key = null;
  var value = '';
  var blockValue = false;

  function add() {
    data[key] = _.isArray(value) ? value.join('\n') : value;
    key = null;
    value = '';
  }

  _.each(lines, function(line) {
    var match = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);

    if (match && key) add();
    if (match) { // New Top Level key found
      key = match[1];
      value = match[2];
      if (value.match(/\|$/)) {
        blockValue = true;
        value = '';
      }
    } else {
      if (!_.isArray(value)) value = [];
      if (blockValue) {
        value.push(line.trim());
      } else {
        value.push(line.replace(/^\s\s/, ''));
      }
    }
  });

  add();
  return data;
};

// chunked path
// -------
//
// _.chunkedPath('path/to/foo')
// =>
// [
//   { url: 'path',        name: 'path' },
//   { url: 'path/to',     name: 'to' },
//   { url: 'path/to/foo', name: 'foo' }
// ]

_.chunkedPath = function(path) {
  var chunks = path.split('/');
  return _.map(chunks, function(chunk, index) {
    var url = [];
    for (var i=0; i<=index; i++) {
      url.push(chunks[i]);
    }
    return {
      url: url.join('/'),
      name: chunk
    };
  });
};

// Full Layout Preview
// -------

_.preview = function(view) {
  var model = view.model;
  var q = queue(1);
  var p = {
        site: app.state.config,
        post: model.metadata,
        page: model.metadata,
        content: Liquid.parse(marked(model.content)).render({
          site: app.state.config,
          post: model.metadata,
          page: model.metadata
        }) || ''
      };

  // Grab a date from the filename
  // and add this post to be evaluated as {{post.date}}
  var parts = app.state.file.split('-');
  var year = parts[0];
  var month = parts[1];
  var day = parts[2];
  var date = [year, month, day].join('-');

  p.post.date = jsyaml.load(date).toDateString();

  if (p.site.prose && p.site.prose.site) {
    _(p.site.prose.site).each(function(file, key) {
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

  q.defer(getLayout);
  q.await(function() {
    var content = p.content;

    // Set base URL to public site
    if (app.state.config.prose && app.state.config.prose.siteurl) {
      content = content.replace(/(<head(?:.*)>)/, function() {
        return arguments[1] + '<base href="' + app.state.config.prose.siteurl + '">';
      });
    }

    document.write(content);
    document.close();
  });

  function getLayout(cb) {
    var file = p.page.layout;

    model.repo.read(app.state.branch, '_layouts/' + file + '.html', function(err, d) {
      if (err) return cb(err);

      var meta = (d.split('---')[1]) ? jsyaml.load(d.split('---')[1]) : {};
      var content = (d.split('---')[2]) ? d.split('---')[2] : d;
      var template = Liquid.parse(content);

      p.page = _(p.page).extend(meta);
      p.content = template.render({
        site: p.site,
        post: p.post,
        page: p.page,
        content: p.content
      });

      if (meta && meta.layout) q.defer(getLayout);
      cb();
    });

  }
};

// Strip out whitespace and replace 
// whitespace with hyphens for a nice class name.
// -------

_.formattedClass = function(str) {
  return str.toLowerCase().replace(/\s/g, '-').replace('&amp;', '');
};

// UI Stuff
// -------
module.exports = {
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
