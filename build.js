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

fs.writeFileSync('templates/templates.js', 'var templates = ' + JSON.stringify(templates) + '; module.exports = templates;');
