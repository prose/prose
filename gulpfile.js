var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var shell = require('gulp-shell');
var browserify = require('browserify');
var rename = require('gulp-rename');
var del = require('del');
var watch = require('gulp-watch');
var gulpif = require('gulp-if');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var merge2 = require('merge2');
var mkdirp = require('mkdirp');
var sass = require('gulp-sass');
var nodeJS = process.execPath;

// Scripts paths.
var paths = {
  vendorScripts: [
    'vendor/liquid.js'
  ],
  app: [
    'app/**/**/*.js'
  ],
  test: [
  'test/**/*.{js, json}',
  'test/index.html',
  '!test/lib/index.js' // built test file
  ],
  templates: [
    'templates/**/*.html'
  ],
  css: [
    'style/**/*.scss'
  ]
};

var production = false;
if (process.env.PROSE_PRODUCTION) {
  production = true;
}
function isProd () {
  return production;
}

var dist = './dist';
var dev = './';

// Removes `dist` folder.
gulp.task('clean', function (cb) {
  del([dist], cb);
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
  mkdirp(dist);
  return gulp.src('')
    .pipe(
      shell([
        nodeJS + ' translations/update_locales',
        nodeJS + ' build'
      ])
    );
});

// Parse stylesheet
gulp.task('css', function () {
  return gulp.src('./style/style.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./'));
});

// Build templates.
gulp.task('templates', function () {
  mkdirp(dist);
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
  mkdirp(dist);
  return gulp.src('')
    .pipe(
      shell([
        '[ -f oauth.json ] && echo "Using existing oauth.json." || curl "https://raw.githubusercontent.com/prose/prose/gh-pages/oauth.json" > oauth.json'
      ])
    );
});

// Build tests, then concatenate with vendor scripts
gulp.task('build-tests', ['templates', 'oauth'], function() {
  var tests = browserify({
    debug: true,
    noParse: [require.resolve('handsontable/dist/handsontable.full')]
  })
  .add('./test/index.js')
  .external(['chai', 'mocha'])
  .bundle()
  .pipe(source('index.js'))
  .pipe(buffer());

  return merge2(gulp.src(paths.vendorScripts), tests)
  .pipe(concat('index.js'))
  .pipe(gulp.dest('./test/lib'));
});

// Browserify app scripts, then concatenate with vendor scripts into `prose.js`.
gulp.task('build-app', ['templates', 'oauth'], function() {
  var app = browserify({
    noParse: [require.resolve('handsontable/dist/handsontable.full')]
  })
  .add('./app/boot.js')
  .bundle()
  .pipe(source('app.js'))
  .pipe(buffer());

  return merge2(gulp.src(paths.vendorScripts), app)
  .pipe(concat('prose.js'))
  .pipe(gulpif(isProd(), uglify()))
  .pipe(gulp.dest(dist));
});

// Watch for changes in `app` scripts.
gulp.task('watch', ['build-app', 'build-tests'], function() {
  // Watch any `.js` file under `app` folder.
  gulp.watch(paths.app, ['build-app', 'build-tests']);
  gulp.watch(paths.test, ['build-tests']);
  gulp.watch(paths.templates, ['build-app']);
  gulp.watch(paths.css, ['css']);
});

gulp.task('run-tests', ['build-tests'], shell.task([
  './node_modules/mocha-phantomjs/bin/mocha-phantomjs test/index.html'
], {ignoreErrors: true}));

// Like watch, but actually run the tests whenever anything changes.
gulp.task('test', ['run-tests'], function() {
  gulp.watch([paths.app, paths.test, paths.templates], ['run-tests'])
});

// Default task which builds the project when we
// run `gulp` from the command line.
gulp.task('default', ['build-tests', 'build-app', 'css']);
