var gulp = require('gulp');
var shell = require('gulp-shell');
var config = require('../config');

/**
 * Translations.
 * To run this task we have to have a `transifex.auth`
 * file inside `translations` folder.
 *  Example file contents:
 * {
 *   "user": "",
 *   "pass": ""
 * }
 * An account can be created at https://www.transifex.com/
 *
**/
gulp.task('translations', function () {
  return gulp.src('')
    .pipe(
      shell([
        'mkdir -p dist',
        'node translations/update_locales',
      ])
    );
});

