// Less configuration
var gulp = require('gulp');
var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('less', function (cb) {
    gulp.src('styles/daggerheart.less')
        .pipe(sourcemaps.init())
        .pipe(less())
        .on('error', console.error.bind(console))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('styles'));
    cb();
});

gulp.task(
    'default',
    gulp.series('less', function (cb) {
        gulp.watch('styles/**/*.less', gulp.series('less'));
        cb();
    })
);
