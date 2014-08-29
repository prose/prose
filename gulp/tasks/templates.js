var gulp = require('gulp');
var shell = require('gulp-shell');
var config = require('../config');

// Build templates.
gulp.task('templates', function () {
  return gulp.src('')
    .pipe(
      shell([
        'mkdir -p dist && node build'
      ])
    );
});

