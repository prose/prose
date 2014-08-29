var gulp = require('gulp');
var webserver = require('gulp-webserver');


gulp.task('serve', function() {
  gulp.src('./')
    .pipe(webserver({
      livereload: false,
      port: 3000
    }));
});
