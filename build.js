var fs = require('fs');
var path = require('path');
var glob = require('glob');
var _ = require('underscore');
var en = require('./translations/locales/en.json');

// Builds html partials into a distributable object to keep index.html clean
var templates = glob.sync('templates/*.html').reduce(function(memo, file) {
var val = fs.readFileSync(file, 'utf8'),
    id = path.basename(file, '.html');

  memo[id] = val;
  return memo;
}, {});

if(!fs.exists('dist')) {
    fs.mkdirSync('dist');
}

fs.writeFileSync('dist/templates.js', 'module.exports = ' + JSON.stringify(templates) + ';');

// Default language is english. Cache this as a data for speed.
fs.writeFileSync('dist/en.js', 'module.exports = ' + JSON.stringify(en) + ';');
