var gulp = require('gulp');
var clean = require('gulp-clean');
var config = require('../config');

// Removes `build` folder.
gulp.task('clean', function () {
  return gulp.src('./dist', { read: false })
    .pipe(clean());
});

