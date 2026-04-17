// Less configuration
var gulp = require('gulp');
var less = require('gulp-less');

gulp.task('less', function () {
    return gulp.src('styles/daggerheart.less').pipe(less()).pipe(gulp.dest('styles'));
});

gulp.task(
    'default',
    gulp.series('less', function (cb) {
        gulp.watch('styles/**/*.less', gulp.series('less'));
        cb();
    })
);
