var gulp = require('gulp');
var config = require('../config');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var concat = require('gulp-concat');

// Concatenate vendor scripts, browserify app scripts and
// merge they both into `prose.js`.
gulp.task('scripts', ['templates', 'oauth'], function() {

  // Concatenate vendor scripts.
  gulp.src(config.paths.vendorScripts)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('dist/'));

  // Browserify app scripts.
  return browserify('./app/boot.js')
    .bundle({debug: true})
    .pipe(source('app.js'))
    .pipe(gulp.dest('./dist/'))

    // Concatenate scripts one browserify finishes.
    .on('end', function() {
      // Concatenate `vendor` and `app` scripts into `prose.js`.
      return gulp.src(['dist/vendor.js', 'dist/app.js'])
        .pipe(concat('prose.js'))
        .pipe(gulp.dest('dist/'));
    });

});



