// Run an array of functions in serial
// -------

_.serial = function () {
  (_(arguments).reduceRight(_.wrap, function() {}))();
};


// Parent path
// -------

_.parentPath = function(path) {
  return path.replace(/\/?[a-zA-Z0-9_-]*$/, "");
};


// Topmost path
// -------

_.topPath = function(path) {
  var match = path.match(/\/?([a-zA-Z0-9_-]*)$/);
  return match[1];
};


// Valid filename check
// -------

_.validFilename = function(filename) {
  return !!filename.match(/^([a-zA-Z0-9_-]|\.)+$/);
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
  if (!path.match(/\//)) return ["", path];
  var matches = path.match(/(.*)\/(.*)$/);
  return [ matches[1], matches[2] ];
};


// Determine mode for CodeMirror
// -------

_.mode = function(file) {
  if (_.markdown(file)) return "gfm";

  var extension = _.extension(file);

  if (_.include(["js", "json"], extension)) return "javascript";
  if (extension === "html") return "htmlmixed";
  if (extension === "rb") return "ruby";
  if (extension === "yml") return "yaml";
  if (extension === "clj") return "clojure";
  if (_.include(["coffee", "cake"], extension)) return "coffeescript";
  if (_.include(["java", "c", "cpp", "cs", "php"], extension)) return "clike";
  
  return extension;
}


// Check if a given file is a Jekyll post
// -------

_.jekyll = function(path, file) {
  return !!(path.match('_posts') && _.markdown(file));
};

// check if a given file has YAML frontmater
// -------
_.hasMetadata = function(content) {
  return content.match( /^(---\n)((.|\n)*?)\n---\n?/ );
}

// Extract file extension
// -------

_.extension = function(file) {
  var match = file.match(/\.(\w+)$/);
  return match ? match[1] : null;
};


// Determines whether a given file is a markdown file or not
// -------

_.markdown = function(file) {
  var regex = new RegExp("\.(md|mkdn?|mdown|markdown)$");
  return !!(regex.test(file));
};


// Clip a string
// -------

_.clip = function(str, length) {
  var res = str.substr(0, length);
  if (length < str.length) res += " ...";
  return res;
};


// Concatenate path + file to full filepath
// -------

_.filepath = function(path, file) {
  return (path ? path +"/" : "") + file;
};


// Converts a javascript object to YAML
// Does not support nested objects
// Multiline values are serialized as Blocks

_.toYAML = function(metadata) {
  var res = [];
  _.each(metadata, function(value, property) {
    if (value.match(/\n/)) {
      var str = property+": |\n";

      _.each(value.split('\n'), function(line) {
        str += "  "+line;
      });

      res.push()
    } else {
      res.push(property+": "+value);
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
  var value = "";
  var blockValue = false;

  function add() {
    data[key] = _.isArray(value) ? value.join('\n') : value;
    key = null;
    value = "";    
  }

  _.each(lines, function(line) {
    var match = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);

    if (match && key) add();
    if (match) { // New Top Level key found
      key = match[1];
      value = match[2];
      if (value.match(/\|$/)) {
        blockValue = true;
        value = "";
      }
      // console.log(key, value);
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
}

// Chunked Path
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
    }
  });
}

/* Full layout preview */

_.preview = function(view) {
  var model = view.model,
      q = queue(1),      
      p = {
        site: app.state.config,
        post: model.metadata,
        page: model.metadata,
        content: Liquid.parse(marked(model.content)).render({
          site: app.state.config,
          post: model.metadata,
          page: model.metadata
        }) || ''
      };

  if (p.site.prose && p.site.prose.site) {
    _(p.site.prose.site).each(function(file, key) {
      q.defer(function(cb){
        $.ajax({
          cache: true,
          dataType: 'jsonp',
          jsonp: false,
          jsonpCallback: 'callback',
          url: file,
          success: function(d) {
            p.site[key] = d;
            cb();
          }
        });
      });
    });
  }

  q.defer(getLayout);
  q.await(function() {
    var content = p.content;

    // Set base URL to public site
    content = content.replace(/(<head(?:.*)>)/, function() {
      return arguments[1] + '<base href="' + app.state.config.prose.siteurl + '">';
    });

    document.write(content);
    document.close();
  });

  function getLayout(cb) {
    var file = p.page.layout;

    model.repo.read(app.state.branch, '_layouts/' + file + '.html', function(err, d) {
      if (err) return cb(err);
      var meta = (d.split('---')[1]) ? jsyaml.load(d.split('---')[1]) : {},
        content = (d.split('---')[2]) ? d.split('---')[2] : d,
        template = Liquid.parse(content);
      p.page = _(p.page).extend(meta);
      p.content = template.render({
        site: p.site,
        post: p.post,
        page: p.page,
        content: p.content
      });
      if (meta.layout) q.defer(getLayout);
      cb();
    });

  }

}

