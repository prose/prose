var fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    _ = require('underscore');

var templates = glob.sync('templates/**/*.html').reduce(function(memo, file) {

  var val = fs.readFileSync(file, 'utf8');
  var dir = path.dirname(file.replace(/templates\//, '')).split('/');
  var id = '';

  if (dir[0].length > 1) {
    function assign(obj, arr, value) {
      var lastIndex = arr.length - 1;
      for (var i = 0; i < lastIndex; ++ i) {
        var key = arr[i];
        if (!(key in obj)) {
          obj[key] = {}
          obj = obj[key];
        }
      }

      obj[arr[lastIndex]] = value;
    }

    id = path.basename(file, '.html');
    dir.push(id);

    assign(memo, dir, val);
  } else {
    // This file is contained in the root dir
    id = path.basename(file, '.html');
    memo[id] = val;
  }

  return memo;
}, {});

fs.writeFileSync('dist/templates.js', 'var templates = ' + JSON.stringify(templates) + '; module.exports = templates;');
