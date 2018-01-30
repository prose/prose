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

var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var watchify = require('watchify');
var notifier = require('node-notifier');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

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

function isProd () {
  return process.env.PROSE_ENV === 'production';
}

gulp.task('setProductionEnv', function () {
  return process.env.PROSE_ENV = 'production';
});

var dist = './dist';
var dev = './';

// Removes `dist` folder.
gulp.task('clean', function (cb) {
  return del([dist], cb);
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

gulp.task('serve', ['javascript'], function () {
  browserSync({
    port: 5000,
    ghostMode: false,
    server: {
      baseDir: ['.'],
      routes: {
        '/node_modules': './node_modules'
      }
    }
  });

  gulp.watch([
    paths.templates
  ]).on('change', reload);

  gulp.watch(paths.css, ['css']);
  gulp.watch(paths.templates, ['templates']);
});

// Parse stylesheet
gulp.task('css', function () {
  return gulp.src('./style/style.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(rename('prose.css'))
    .pipe(gulp.dest(dist))
    .pipe(reload({stream: true}));
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

gulp.task('javascript', ['templates', 'oauth'], function () {
  var watcher = watchify(browserify({
    entries: ['./app/boot.js'],
    noParse: [require.resolve('handsontable/dist/handsontable.full')],
    debug: true,
    cache: {},
    packageCache: {},
    fullPaths: true
  }), {poll: true});

  function bundler () {
    return watcher.bundle()
      .on('error', function (e) {
        notifier.notify({
          title: 'Oops! Browserify errored:',
          message: e.message
        });
        console.log('Javascript error:', e);
        if (isProd()) {
          process.exit(1);
        }
        // Allows the watch to continue.
        this.emit('end');
      })
      .pipe(source('prose.js'))
      .pipe(buffer())
      // Source maps.
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(dist))
      .pipe(reload({stream: true}));
  }

  watcher
  .on('log', gutil.log)
  .on('update', bundler);

  return bundler();
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

var testTask = shell.task([
  './node_modules/mocha-phantomjs/bin/mocha-phantomjs test/index.html'
], {ignoreErrors: true});

gulp.task('test', ['build-tests'], testTask);

// Run tests in command line on app, test, or template change
gulp.task('test-ci', ['test'], function() {
  gulp.watch([paths.app, paths.test, paths.templates], ['test'])
});

// Build site, tests
gulp.task('build', ['javascript', 'css']);
gulp.task('default', ['build']);

// Minify build
gulp.task('production', ['setProductionEnv', 'build']);
