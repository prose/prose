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
var del = require('del');
var watch = require('gulp-watch');
var source = require('vinyl-source-stream');
var mkdirp = require('mkdirp');
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
  ],
  test: [
  'test/**/*.{js, json}',
  '!test/lib/index.js', // built test file
  '!test/lib/polyfill.js' // built test file.
  ],
  templates: [
    'templates/**/*.html'
  ]
};


// Removes `dist` folder.
gulp.task('clean', function (cb) {
  del(['dist'], cb);
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
  mkdirp('dist');
  return gulp.src('')
    .pipe(
      shell([
        nodeJS + ' translations/update_locales',
        nodeJS + ' build'
      ])
    );
});


// Default tasks.
// ---------------------------

// Build templates.
gulp.task('templates', function () {
  mkdirp('dist');
  return gulp.src('')
    .pipe(
      shell([
        "\"" + nodeJS + "\"" + ' build'
      ])
    );
});


// Creates `dist` directory if not created and
// creates `oauth.json`.
gulp.task('oauth', function () {
  mkdirp('dist');
  return gulp.src('')
    .pipe(
      shell([
        '[ -f oauth.json ] && echo "Using existing oauth.json." || curl "https://raw.githubusercontent.com/prose/prose/gh-pages/oauth.json" > oauth.json'
      ])
    );
});



// Concatenate vendor scripts into dist/vendor.js
gulp.task('vendor', function() {
  gulp.src(paths.vendorScripts)
  .pipe(concat('vendor.js'))
  .pipe(gulp.dest('dist/'));
})


// Build tests.
gulp.task('build-tests', ['templates', 'oauth', 'vendor'], function() {

  // Browserify polyfill-require.js
  // Pass `debug` option to enable source maps.
  browserify({debug:true})
    .add('./test/lib/polyfill-require.js')
    .require('./test/lib/sourcemap-hack', {expose: 'sourcemap-hack'})
    .bundle()
    .pipe(source('polyfill.js'))
    .pipe(gulp.dest('./test/lib/'));

  // Browserify index.js
  // Pass `debug` option to enable source maps.
  return browserify({
    debug: true,
    noParse: [require.resolve('handsontable/dist/handsontable.full')]
  })
    .add('./test/index.js')
    .external(['chai', 'mocha'])
    .bundle()
    .pipe(source('index.js')) // Output file.
    .pipe(gulp.dest('./test/lib/')); // Output folder.

});


// Browserify app scripts, then concatenate with vendor scripts into `prose.js`.
gulp.task('build-app', ['templates', 'oauth', 'vendor'], function() {


  // Browserify app scripts.
  return browserify({
    noParse: [require.resolve('handsontable/dist/handsontable.full')]
  })
    .add('./app/boot.js')
    .bundle()
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
gulp.task('uglify', ['build-app'], function() {

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
gulp.task('watch', ['build-app', 'build-tests'], function() {
  // Watch any `.js` file under `app` folder.
  gulp.watch(paths.app, ['build-app', 'build-tests']);
  gulp.watch(paths.test, ['build-tests']);
  gulp.watch(paths.templates, ['build-app']);
});


gulp.task('run-tests', ['build-tests'], shell.task([
  './node_modules/.bin/mocha-phantomjs test/index.html'
], {ignoreErrors: true}));

// Like watch, but actually run the tests whenever anything changes.
gulp.task('test', ['run-tests'], function() {
  gulp.watch([paths.app, paths.test, paths.templates], ['run-tests'])
});


// Default task which builds the project when we
// run `gulp` from the command line.
gulp.task('default', ['build-tests', 'build-app', 'uglify']);
