var fs = require('fs');
var path = require('path');
var glob = require('glob');
var _ = require('underscore');
var en = require('./translations/locales/en.json');

// Builds html partials into a distributable object to keep index.html clean
var templates = glob.sync('templates/**/*.html').reduce(function(memo, file) {

  var val = fs.readFileSync(file, 'utf8');
  var dir = path.dirname(file.replace(/templates\//, '')).split('/');
  var id = path.basename(file, '.html');

  if (dir[0].length > 1) {
    function assign(obj, arr, value) {
      var lastIndex = arr.length - 1;
      for (var i = 0; i < lastIndex; ++ i) {
        var key = arr[i];
        if (!(key in obj)) {
          obj[key] = {}
        }
        obj = obj[key];
      }
      obj[arr[lastIndex]] = value;
    }

    dir.push(id);
    assign(memo, dir, val);
  } else {
    // This file is contained in the root dir
    memo[id] = val;
  }

  return memo;
}, {});

fs.writeFileSync('dist/templates.js', 'module.exports = ' + JSON.stringify(templates) + ';');

// Default language is english. Cache this as a data for speed.
fs.writeFileSync('dist/en.js', 'module.exports = ' + JSON.stringify(en) + ';');
