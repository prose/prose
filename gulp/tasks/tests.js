var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var config = require('../config');


// Built tests.
gulp.task('tests', function() {

  // Browserify index.js
  browserify('./test/index.js')

    // Pass `debug` option to enable source maps.
    .bundle({ debug: true })

    // Output file.
    .pipe(source('index.js'))

    // Output folder.
    .pipe(gulp.dest('./test/lib/'));


  // Browserify polyfill-require.js
  browserify('./test/lib/polyfill-require.js')

    // Pass `debug` option to enable source maps.
    .bundle({debug: true})
    .pipe(source('polyfill.js'))
    .pipe(gulp.dest('./test/lib/'));

});


