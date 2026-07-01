// Less configuration
const gulp = require('gulp');
const less = require('gulp-less');
const sourcemaps = require('gulp-sourcemaps');

gulp.task('less', function () {
    return gulp.src('styles/daggerheart.less')
        .pipe(sourcemaps.init())
        .pipe(less())
        .on('error', console.error.bind(console))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('styles'));
});

gulp.task(
    'default',
    gulp.series('less', function (cb) {
        gulp.watch('styles/**/*.less', gulp.series('less'));
        cb();
    })
);
