// Build file.
// See: https://github.com/prose/prose/issues/702

// Require dependencies.
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var shell = require('gulp-shell');
var browserify = require('browserify');
var rename = require('gulp-rename');
var clean = require('gulp-clean');

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
  ]
};


// Removes `build` folder.
gulp.task('clean', function () {

  // Use `gulp-clean` to remove folder.
  return gulp.src('dist', {read: false})
    .pipe(clean());
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
        'node translations/update_locales',
      ])
    )
});


// Default tasks.
// ---------------------------

// Build templates.
gulp.task('templates', function () {
  return gulp.src('')
    .pipe(
      shell([
        'mkdir -p dist && node build'
      ])
    )
});


// Creates `dist` directory if not created and 
// creates `oauth.json`.
gulp.task('oauth', function () {
  return gulp.src('')
    .pipe(
      shell([
        'mkdir -p dist',
        'curl "https://raw.githubusercontent.com/prose/prose/gh-pages/oauth.json" > oauth.json'
      ])
    )
});


// Built tests.
gulp.task('tests', function() {
  return gulp.src('')
    .pipe(
    shell([
      'browserify -d test/index.js -o test/lib/index.js',
      'browserify test/lib/polyfill-require.js -o test/lib/polyfill.js'
    ])  
  )
});


// Concatenate and browserify scripts.
gulp.task('scripts', ['templates', 'oauth'], function() {
  
  // Concatenate scripts and pass them through `browserify`.
  return gulp.src(paths.vendorScripts)
    .pipe(concat('prose.js'))
    .pipe(gulp.dest('dist/'))
    .pipe(
      shell([
        'browserify -d app/boot.js >> dist/prose.js'
      ])
    )
    
});


// Compress `prose.js`.
gulp.task('uglify', ['scripts'], function() {

  return gulp.src('dist/prose.js')
    .pipe(rename('prose.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'))
});


// Default task which builds the project when we 
// run `gulp` from the command line.
gulp.task('default', ['tests', 'uglify']);
