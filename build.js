var fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    _ = require('underscore');

// TODO: map subdirectory templates to proper namespace
var templates = glob.sync('templates/**/*.html').reduce(function(memo, file) {
  var val = fs.readFileSync(file, 'utf8'),
      id = path.basename(file, '.html');

  memo[id] = val;
  return memo;
}, {});

fs.writeFileSync('dist/templates.js', 'var templates = ' + JSON.stringify(templates) + '; module.exports = templates;');
