const gulp = require('gulp');
const sass = require('gulp-sass');
const babel = require('gulp-babel');
const browserSync = require('browser-sync').create();
const concat = require("gulp-concat");
const sourcemaps = require("gulp-sourcemaps");
const del = require('del');

gulp.task('serve', () => {

    browserSync.init({
    server: "./"
    });

    gulp.watch("src/sass/**/*.scss", gulp.parallel(['sass--browserSync']));
    gulp.watch("src/js/**/*.js", gulp.parallel(['scripts--browserSync']));
    gulp.watch("index.html").on('change', browserSync.reload);
});

gulp.task('sass--browserSync', () => {
    return gulp.src("src/sass/main.scss")
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("dist/css"))
        .pipe(browserSync.stream());
});

gulp.task("scripts--browserSync", () => {
    return gulp.src(["src/js/vendor/modernizr-3.5.0.min.js", "src/js/vendor/jquery-3.2.1.min.js", "src/js/plugins.js", "src/js/main.js"])
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(concat("app.js"))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("dist/js"))
        .pipe(browserSync.stream());
});

gulp.task('sass', () => {
    return gulp.src("src/sass/main.scss")
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("dist/css"));
});

gulp.task("scripts", () => {
    return gulp.src(["src/js/vendor/modernizr-3.5.0.min.js", "src/js/vendor/jquery-3.2.1.min.js", "src/js/plugins.js", "src/js/main.js"])
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(concat("app.js"))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("dist/js"));
});

gulp.task("del", () => {
    return del(["dist/**"]);
});

gulp.task('dev', gulp.series(['del', gulp.parallel(['sass--browserSync', 'scripts--browserSync']), 'serve']));

gulp.task('deploy', gulp.series(['del', gulp.parallel(['sass', 'scripts'])]));
