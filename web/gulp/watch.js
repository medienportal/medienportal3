'use strict';

var gulp = require('gulp');

function isOnlyChange(event) {
  return event.type === 'changed';
}

module.exports = function(options) {
  gulp.task('watch', ['scripts:watch', 'inject'], function () {

    gulp.watch([options.src + '/*.html', 'bower.json'], ['inject']);

    gulp.watch([
      options.src + '/app/**/*.css',
      options.src + '/app/**/*.scss'
    ], function(event) {
      if(isOnlyChange(event)) {
        gulp.start('styles');
      } else {
        gulp.start('inject');
      }
    });


    gulp.watch(options.src + '/app/**/*.html', function(event) {

    });
  });
};
