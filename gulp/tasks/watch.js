var gulp = require('gulp');
var browserify = require('browserify');
var concat = require('gulp-concat');
var watch = require('gulp-watch');
var source = require('vinyl-source-stream');
var debug = require('gulp-debug');
var config = require('../config');

gulp.task('watch', ['templates'], function() {
  // Watch any `.js` file under `app` folder.
  return gulp.src(['app/**/**/*.js', './style.css'])
    .pipe(watch(function() {
      // Browserify `boot.js`
      return browserify('./app/boot.js')
        .bundle({ debug: true })
        .pipe(source('app.js'))
        .pipe(gulp.dest('./dist/'))

        // Concatenate scripts one browserify finishes.
        .on('end', function() {
          // Concatenate `vendor` and `app` scripts into `prose.js`.
          return gulp.src(['dist/vendor.js', 'dist/app.js'])
            .pipe(concat('prose.js'))
            .pipe(gulp.dest('dist/'));
        });
    }));
});



