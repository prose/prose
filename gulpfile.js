// Build file.
// Usage:
//
//    $ gulp
//
// See: https://github.com/prose/prose/issues/702

// Require dependencies.
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var shell = require('gulp-shell');
var browserify = require('browserify');
var rename = require('gulp-rename');
var rimraf = require('gulp-rimraf');
var watch = require('gulp-watch');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var nodeJS = process.execPath;

// Scripts paths.
var paths = {
  vendorScripts: [
    'vendor/codemirror/codemirror.js',
    'vendor/codemirror/overlay.js',
    'vendor/codemirror/htmlmixed.js',
    'vendor/codemirror/clike.js',
    'vendor/codemirror/yaml.js',
    'vendor/codemirror/ruby.js',
    'vendor/codemirror/markdown.js',
    'vendor/codemirror/xml.js',
    'vendor/codemirror/javascript.js',
    'vendor/codemirror/css.js',
    'vendor/codemirror/gfm.js',
    'vendor/liquid.js'
  ],
  app: [
    'app/**/**/*.js'
  ]
};


// Removes `dist` folder.
gulp.task('clean', function () {

  return gulp.src('dist', {read: false})
    .pipe(rimraf());
});


// Translations.
// To run this task we have to have a `transifex.auth`
// file inside `translations` folder.
// Example file contents:
//
//  {
//    "user": "",
//    "pass": ""
//  }
//
// An account can be created at https://www.transifex.com/
//
gulp.task('translations', function () {
  return gulp.src('')
    .pipe(
      shell([
        'mkdir -p dist',
        nodeJS + ' translations/update_locales',
        nodeJS + ' build'
      ])
    );
});


// Default tasks.
// ---------------------------

// Build templates.
gulp.task('templates', function () {
  return gulp.src('')
    .pipe(
      shell([
        'mkdir -p dist && ' + nodeJS + ' build'
      ])
    );
});


// Creates `dist` directory if not created and
// creates `oauth.json`.
gulp.task('oauth', function () {
  return gulp.src('')
    .pipe(
      shell([
        'mkdir -p dist',
        '[ -f oauth.json ] && echo "Using existing oauth.json." || curl "https://raw.githubusercontent.com/prose/prose/gh-pages/oauth.json" > oauth.json'
      ])
    );
});


// Build tests.
gulp.task('tests', function() {

  // Browserify index.js
  browserify('./test/index.js')

    // Pass `debug` option to enable source maps.
    .bundle({debug: true})

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


// Concatenate vendor scripts, browserify app scripts and
// merge them both into `prose.js`.
gulp.task('scripts', ['templates', 'oauth'], function() {

  // Concatenate vendor scripts.
  gulp.src(paths.vendorScripts)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('dist/'));

  // Browserify app scripts.
  return browserify('./app/boot.js')
    .bundle({debug: true})
    .pipe(source('app.js'))
    .pipe(gulp.dest('./dist/'))

    // Concatenate scripts once browserify finishes.
    .on('end', function() {

      // Concatenate `vendor` and `app` scripts into `prose.js`.
      return gulp.src(['dist/vendor.js', 'dist/app.js'])
        .pipe(concat('prose.js'))
        .pipe(gulp.dest('dist/'));
    });

});


// Compress `prose.js`.
gulp.task('uglify', ['scripts'], function() {

  return gulp.src('dist/prose.js')
    .pipe(rename('prose.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});


// Watch for changes in `app` scripts.
// Usage:
//
//    $ gulp watch
//
gulp.task('watch', ['templates'], function() {

  // Watch any `.js` file under `app` folder.
  return gulp.src(paths.app)
    .pipe(watch(function() {

      // Browserify `boot.js`
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

    }));

});


// Default task which builds the project when we
// run `gulp` from the command line.
gulp.task('default', ['tests', 'scripts', 'uglify']);
