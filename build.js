var fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    _ = require('underscore');

var templates = glob.sync('templates/*.html').reduce(function(memo, file) {
  var val = fs.readFileSync(file, 'utf8'),
      id = path.basename(file, '.html');

  memo[id] = val;
  return memo;
}, {});

fs.writeFileSync('dist/templates.js', 'var templates = ' + JSON.stringify(templates) + '; module.exports = templates;');

// Build out the default english script for locales
// or if one is not specified.
fs.writeFileSync('data/data.js', 'Prose.data = ' + JSON.stringify(locales: JSON.parse('translations/locales.json'), null, 4) + ';');
