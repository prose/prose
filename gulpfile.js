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
var postcss = require('gulp-postcss');
const Mocha = require('mocha');
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
    'style/**/*.css'
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

gulp.task('build-translations', function () {
  mkdirp(dist);
  return gulp.src('')
    .pipe(
      shell([
        nodeJS + ' translations/update_locales',
        nodeJS + ' build'
      ])
    );
});

gulp.task('test-translations', function () {
  return new Promise((resolve, reject) => {
    const mocha = new Mocha();
  
    mocha.addFile('test/translations/strings.js');
  
    mocha.run(function(failures) {
      process.exitCode = failures ? 1 : 0;
      if (failures) {
        reject(new Error('Test failed. See the above output for details. Ensure that all strings used in the project are defined in en.json'));
      } else {
        resolve();
      }
    });
  });
});

gulp.task('translations', gulp.series('build-translations', 'test-translations'))


// Parse stylesheet
gulp.task('css', function () {
  return gulp.src('./style/style.css')
    .pipe(
      postcss([
        require('postcss-import')({ root: process.cwd() + '/styles' })
      ])
        .on('error', (err) => { console.error(err) })
    )
    .pipe(rename('prose.css'))
    .pipe(gulp.dest(dist));
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
gulp.task('watch', ['build-app', 'build-tests', 'css'], function() {
  // Watch any `.js` file under `app` folder.
  gulp.watch(paths.app, ['build-app', 'build-tests']);
  gulp.watch(paths.test, ['build-tests']);
  gulp.watch(paths.templates, ['build-app']);
  gulp.watch(paths.css, ['css']);
});

var testTask = shell.task([
  './node_modules/mocha-phantomjs/bin/mocha-phantomjs test/index.html'
]);

gulp.task('test', gulp.parallel('test-translations', gulp.series('build-tests', testTask)));

// Run tests in command line on app, test, or template change
gulp.task('test-ci', ['test'], function() {
  gulp.watch([paths.app, paths.test, paths.templates], ['test'])
});

// Build site, tests
gulp.task('build', ['build-tests', 'build-app', 'css']);
gulp.task('default', ['build']);

// Minify build
gulp.task('production', ['setProductionEnv', 'build']);
