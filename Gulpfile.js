const gulp        = require('gulp');
const babel       = require('gulp-babel');
const mocha       = require('gulp-mocha');
const del         = require('del');

gulp.task('clean', function () {
    return del('lib');
});

gulp.task('lint', function () {
    var eslint = require('gulp-eslint');

    return gulp
        .src([
            'src/**/*.js',
            'test/**/*.js',
            'Gulpfile.js'
        ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('build', gulp.series('clean', 'lint', function () {
    return gulp
        .src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
}));

gulp.task('test', gulp.series('build', function () {
    return gulp
        .src('test/**.js')
        .pipe(mocha({
            ui:       'bdd',
            reporter: 'spec',
            timeout:  typeof v8debug === 'undefined' ? 2000 : Infinity // NOTE: disable timeouts in debug
        }));
}));
