var gulp = require('gulp');
var closureCompiler = require('gulp-closure-compiler');

gulp.task('default', function() {
    return gulp.src('angular-slimscroll-aiska.js')
        .pipe(closureCompiler('angular-slimscroll-aiska.min.js'))
        .pipe(gulp.dest(''));
});