var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var config = require('../config');

// Compress `prose.js`.
gulp.task('uglify', ['scripts'], function() {
  return gulp.src('dist/prose.js')
    .pipe(rename('prose.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});


