var gulp = require('gulp');
var shell = require('gulp-shell');
var config = require('../config');

// Creates `dist` directory if not created and
// creates `oauth.json`.
gulp.task('oauth', function () {
  return gulp.src('')
    .pipe(
      shell([
        'curl "https://raw.githubusercontent.com/prose/prose/gh-pages/oauth.json" > oauth.json'
      ])
    );
});

